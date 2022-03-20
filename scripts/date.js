const moment  = require("moment")

const a = new Date(moment().add(1, 'days'))     //  convert the moment time format to Date format

b = a.getTime()     // convert it to timestamp


const format = moment(b).format('h:mm:ss a M/D')        //  recover the date and time from the timestamp

console.log(format)

