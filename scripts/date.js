const moment  = require("moment")



const date = new Date()


const currentDate = date.getTime()
//const 2DaysLate = date.setDate()

console.log(currentDate)

const format = moment.unix(currentDate).format('h:mm:ss a M/D')

console.log(moment().format())