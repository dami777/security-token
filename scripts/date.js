const moment  = require("moment")

//const a = new Date(moment().add(1, 'days'))     //  convert the moment time format to Date format
const a = new Date(moment().subtract(1, 'days'))
b = a.getTime()     // convert it to timestamp


//const format = moment(b).format('h:mm:ss a M/D')        //  recover the date and time from the timestamp

/*console.log(format)

b = new Date().getTime()
console.log(b)*/

console.log(b)

c = new Date(moment().subtract(1, 'days').unix())

console.log(c.getTime())

t2 = moment.unix(c.getTime()).format('h:mm:ss a M/D')

console.log(t2)


d = new Date(moment().add(15, 'seconds').unix())

//console.log(d, "seconds")

e = moment.unix(d.getTime()).format('h:mm:ss a M/D')

console.log(e)