const Organization = require('./Organization');
const Table = require('./Table');
const Checkout = require('./Checkout');

Organization.hasMany(Checkout, { foreignKey: 'organizationId' });
Checkout.belongsTo(Organization, { foreignKey: 'organizationId' });

Table.hasMany(Checkout, { foreignKey: 'tableId' });
Checkout.belongsTo(Table, { foreignKey: 'tableId' });

module.exports = {
  Organization,
  Table,
  Checkout,
};