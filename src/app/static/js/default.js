// page
var page = new ViePage();


/**
 * initialize page
 */
$(document).ready(function () {
    console.log("Ready.");

    $(".datepicker").datepicker({
        format: 'yyyy-mm-dd',
        autoclose: true,
        todayHighlight: true
    });
});


/**
 * format date to string yyyy-MM-dd
 * @param {} dateObject 
 * @returns 
 */
$.date = function (dateObject) {
    var d = new Date(dateObject);
    var day = d.getDate();
    var month = d.getMonth() + 1;
    var year = d.getFullYear();
    if (day < 10) {
        day = "0" + day;
    }
    if (month < 10) {
        month = "0" + month;
    }
    var date = year + "-" + month + "-" + day;

    return date;
};


/**
 * format date to string yyyy-MM-dd hh:mm:ss
 * @param {} dateObject 
 * @returns 
 */
$.datetime = function (dateObject) {
    var d = new Date(dateObject);
    var day = d.getDate();
    var month = d.getMonth() + 1;
    var year = d.getFullYear();
    var hour = d.getHours();
    var minute = d.getMinutes();
    var second = d.getSeconds();
    if (day < 10) {
        day = "0" + day;
    }
    if (month < 10) {
        month = "0" + month;
    }
    var date = year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;

    return date;
}