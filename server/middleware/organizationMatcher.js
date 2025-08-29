const fuzz = require('fuzzball');
const { Organization, Checkout } = require('../models');
const { Op } = require('sequelize');

class OrganizationMatcher {
  constructor() {
    this.similarityThreshold = 80;
    this.exactMatchThreshold = 95;
  }

  normalizeString(str) {
    return str
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  generateCommonVariations(name) {
    const variations = new Set();
    const normalized = this.normalizeString(name);
    
    variations.add(normalized);
    variations.add(name.toLowerCase().trim());
    
    const withoutCommon = normalized.replace(/\b(club|society|organization|association|team|group|at ut|at texas|university)\b/g, '').trim();
    if (withoutCommon) variations.add(withoutCommon);
    
    const texasVariations = [
      normalized.replace(/\btexas\b/g, 'tx'),
      normalized.replace(/\btx\b/g, 'texas'),
      normalized.replace(/\but\b/g, 'university of texas'),
      normalized.replace(/\buniversity of texas\b/g, 'ut'),
    ];
    texasVariations.forEach(v => variations.add(v));
    
    const acronym = name
      .split(' ')
      .filter(word => word.length > 2 && !/^(the|of|and|for|at|in|on|by|to|from)$/i.test(word))
      .map(word => word.charAt(0).toLowerCase())
      .join('');
    if (acronym.length >= 2) variations.add(acronym);
    
    return Array.from(variations).filter(v => v.length > 1);
  }

  async findSimilarOrganizations(inputName) {
    try {
      const variations = this.generateCommonVariations(inputName);
      const normalizedInput = this.normalizeString(inputName);
      
      const organizations = await Organization.findAll({
        where: {
          status: 'active',
        },
      });
      
      const matches = [];
      
      for (const org of organizations) {
        let highestScore = 0;
        let matchType = 'none';
        let matchedText = '';
        
        const allNamesToCheck = [
          org.officialName,
          ...org.aliases,
          ...this.generateCommonVariations(org.officialName),
        ].filter(Boolean);
        
        for (const nameToCheck of allNamesToCheck) {
          const normalizedCheck = this.normalizeString(nameToCheck);
          
          if (variations.includes(normalizedCheck)) {
            highestScore = 100;
            matchType = 'exact_variation';
            matchedText = nameToCheck;
            break;
          }
          
          const ratio = fuzz.ratio(normalizedInput, normalizedCheck);
          const partialRatio = fuzz.partial_ratio(normalizedInput, normalizedCheck);
          const tokenSetRatio = fuzz.token_set_ratio(normalizedInput, normalizedCheck);
          
          const score = Math.max(ratio, partialRatio, tokenSetRatio);
          
          if (score > highestScore) {
            highestScore = score;
            matchedText = nameToCheck;
            
            if (score >= this.exactMatchThreshold) {
              matchType = 'exact';
            } else if (score >= this.similarityThreshold) {
              matchType = 'similar';
            }
          }
        }
        
        if (highestScore >= this.similarityThreshold) {
          matches.push({
            organization: org,
            score: highestScore,
            matchType,
            matchedText,
          });
        }
      }
      
      return matches.sort((a, b) => b.score - a.score);
      
    } catch (error) {
      console.error('Error in findSimilarOrganizations:', error);
      return [];
    }
  }

  async findExactMatch(inputName) {
    const matches = await this.findSimilarOrganizations(inputName);
    return matches.find(match => match.score >= this.exactMatchThreshold) || null;
  }

  async checkActiveCheckout(organizationId) {
    try {
      const activeCheckout = await Checkout.findOne({
        where: {
          organizationId,
          status: 'active',
        },
        include: [
          {
            model: require('../models').Table,
            attributes: ['tableNumber', 'location'],
          },
        ],
      });
      
      return activeCheckout;
    } catch (error) {
      console.error('Error checking active checkout:', error);
      return null;
    }
  }

  async validateCheckoutAttempt(inputName) {
    try {
      const matches = await this.findSimilarOrganizations(inputName);
      
      if (matches.length === 0) {
        return {
          allowed: true,
          matches: [],
          message: 'No existing organizations found. New organization will be created.',
        };
      }
      
      const exactMatch = matches.find(match => match.score >= this.exactMatchThreshold);
      
      if (exactMatch) {
        const activeCheckout = await this.checkActiveCheckout(exactMatch.organization.id);
        
        if (activeCheckout) {
          return {
            allowed: false,
            matches: [exactMatch],
            activeCheckout,
            message: `Organization "${exactMatch.organization.officialName}" already has an active checkout.`,
          };
        }
        
        return {
          allowed: true,
          matches: [exactMatch],
          confirmedOrganization: exactMatch.organization,
          message: `Exact match found: "${exactMatch.organization.officialName}".`,
        };
      }
      
      const similarMatches = matches.filter(match => match.score >= this.similarityThreshold);
      
      if (similarMatches.length > 0) {
        const activeCheckouts = await Promise.all(
          similarMatches.map(async match => ({
            match,
            activeCheckout: await this.checkActiveCheckout(match.organization.id),
          }))
        );
        
        const withActiveCheckouts = activeCheckouts.filter(item => item.activeCheckout);
        
        if (withActiveCheckouts.length > 0) {
          return {
            allowed: false,
            matches: similarMatches,
            activeCheckouts: withActiveCheckouts,
            message: 'Similar organizations with active checkouts found.',
          };
        }
        
        return {
          allowed: false,
          matches: similarMatches,
          requireConfirmation: true,
          message: 'Similar organizations found. Please confirm if this is a new organization or select an existing one.',
        };
      }
      
      return {
        allowed: true,
        matches: [],
        message: 'No similar organizations found. New organization will be created.',
      };
      
    } catch (error) {
      console.error('Error in validateCheckoutAttempt:', error);
      return {
        allowed: false,
        matches: [],
        message: 'Error validating checkout attempt.',
      };
    }
  }

  async createNewOrganization(name, category = 'Student Organization') {
    try {
      const aliases = this.generateCommonVariations(name)
        .filter(variation => variation !== this.normalizeString(name));
      
      const organization = await Organization.create({
        officialName: name,
        aliases,
        category,
        status: 'active',
        scrapedDate: null,
      });
      
      return organization;
    } catch (error) {
      console.error('Error creating new organization:', error);
      throw error;
    }
  }
}

module.exports = OrganizationMatcher;