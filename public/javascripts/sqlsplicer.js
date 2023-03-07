
var sql = require('../../routes/sql.js');
const { arrayUnionByAddingPartsOfObjects } = require('./arrayTools.js');
var arrayTools = require('./arrayTools.js');
const TicketState = require('./ticketstate.js');


module.exports = {

  insertCourseUserInfoToUserIdReferences: function(array, idReferenceKey, courseid) {
      var ids = arrayTools.extractAttributes(array, idReferenceKey);
      return sql.courses.getUserInfoListForCourse(ids, courseid)
      .then((userdata) => {
        return arrayTools.arrayUnionWithKeys(array, userdata, idReferenceKey, 'id');
      });
  },

  insertTicketFieldsToIdReferences: function(ticketArray, idReferenceKey) {
    var ids = arrayTools.extractAttributes(ticketArray, idReferenceKey);
    return sql.tickets.getFieldsOfTicketList(ids)
    .then((fields) => {
      return arrayTools.arrayUnionByAddingObjectsToArray(ticketArray, fields, 'id', 'tiketti', 'kentat');
    });
  },

  removeArchivedTickets: function(ticketArray) {
    return ticketArray.filter(function(value, index, array) {
      return value.tila !== TicketState.archived;
    });
  }

}