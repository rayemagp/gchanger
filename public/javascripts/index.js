var app = angular.module('thisApp', []);
app.controller('thisController', [
    '$scope', '$http', '$sce' ,'$anchorScroll','$location',
    function($scope, $http, $sce, $anchorScroll, $location) {

        //fallback database
        $http({method: 'GET',url: window.location.href + 'database/gamechangers.json'}).success(function(data){

        $scope.database = data;

        //UNPACK JSON FILE
        //initialise new Array and push database items into an Array
        all = [];
        var i = 1;
        for (var firm in $scope.database) {

            //parse to safe html
            //replace watch first with v/
            var link = $scope.database[firm].SummaryVid.replace("watch?v=", "embed/");

            //check if youtube link, remove if not
            if(link.match("youtube")) {
                $scope.database[firm].SummaryVid = $sce.trustAsResourceUrl(link);
            }
            else{
                $scope.database[firm].SummaryVid = "";
            }

            all.push($scope.database[firm]);
            i++;
        }
        $scope.database = all;

    });

    socket.on('receiveChangers',function(data){
        $scope.$apply(function(){

            //sort data by company
            console.log(data);
            sortBy(data, {
                prop: "Company",
                parser: function (item) {
                    return item.toUpperCase();
                }
            });
            console.log(data);
            //put images in array to be pushed onto the main gameChangers array
            var list = [];
            for (var item in data)
            {
                list.push(data[item].image);
            }

            //push the images as a secure resource into main gameChangers array
            var i = 0;
            for (var firm in $scope.database) {
                $scope.database[firm].image = $sce.trustAsResourceUrl(list[i]);
                i++;
            }


        });
    });
}]);

//connect to server socket.io
var socket = io.connect();
var client = this;
socket.on('connect',function(){
});

//sorting function for json arrays
var sortBy = (function () {

    //cached privated objects
    var _toString = Object.prototype.toString,
    //the default parser function
        _parser = function (x) { return x; },
    //gets the item to be sorted
        _getItem = function (x) {
            return this.parser((_toString.call(x) === "[object Object]" && x[this.prop]) || x);
        };

    // Creates a method for sorting the Array
    // @array: the Array of elements
    // @o.prop: property name (if it is an Array of objects)
    // @o.desc: determines whether the sort is descending
    // @o.parser: function to parse the items to expected type
    return function (array, o) {
        if (!(array instanceof Array) || !array.length)
            return [];
        if (_toString.call(o) !== "[object Object]")
            o = {};
        if (typeof o.parser !== "function")
            o.parser = _parser;
        //if @o.desc is false: set 1, else -1
        o.desc = [1, -1][+!!o.desc];
        return array.sort(function (a, b) {
            a = _getItem.call(o, a);
            b = _getItem.call(o, b);
            return ((a > b) - (b > a)) * o.desc;
        });
    };

}());


