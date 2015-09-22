/*! 
 * angular-advanced-searchbox
 * https://github.com/dnauck/angular-advanced-searchbox
 * Copyright (c) 2015 Nauck IT KG http://www.nauck-it.de/
 * Author: Daniel Nauck <d.nauck(at)nauck-it.de>
 * License: MIT
 */

(function() {

'use strict';

angular.module('angular-advanced-searchbox', [])
    .directive('nitAdvancedSearchbox', function() {
        return {
            restrict: 'E',
            scope: {
                model: '=ngModel',
                parameters: '=',
                defaultparams: '=',
                enter: '=',
                placeholder: '@'
            },
            replace: true,
            templateUrl: 'angular-advanced-searchbox.html',
            controller: [
                '$scope', '$attrs', '$element', '$timeout', '$filter',
                function ($scope, $attrs, $element, $timeout, $filter) {

                    $scope.placeholder = $scope.placeholder || 'Search ...';
                    $scope.searchParams = [];
                    $scope.searchQuery = '';
                    $scope.setSearchFocus = false;
                    $scope.Enter = $scope.enter;
                    var searchThrottleTimer;
                    var changeBuffer = [];
                    if ($scope.defaultparams) {
                       if (!$scope.defaultparams.query) {
                          $scope.defaultparams.query = '';
                       }
                    } else {
                        $scope.defaultparams = {};
                    }
                    $scope.model = angular.copy($scope.defaultparams);

                    $scope.$watch('defaultparams', function () {
                       $scope.model = angular.copy($scope.defaultparams);
                    });

                    $scope.$watch('model', function (newValue, oldValue) {
                        if(angular.equals(newValue, oldValue))
                            return;

                        angular.forEach($scope.model, function (value, key) {
                            if (key === 'query' && $scope.searchQuery !== value) {
                                $scope.searchQuery = value;
                            } else {
                                var paramTemplate = $filter('filter')($scope.parameters, function (param) { return param.key === key; })[0];
                                var searchParam = $filter('filter')($scope.searchParams, function (param) { return param.key === key; })[0];

                                if (paramTemplate !== undefined) {
                                    if(searchParam === undefined)
                                        $scope.addSearchParam(paramTemplate, value, false);
                                    else if (searchParam.value !== value )
                                        searchParam.value = value;
                                }
                            }
                        });

                        // delete not existing search parameters from internal state array
                        angular.forEach($scope.searchParams, function (value, key){
                            if (!$scope.model.hasOwnProperty(value.key)){
                                var index = $scope.searchParams.map(function(e) { return e.key; }).indexOf(value.key);
                                $scope.removeSearchParam(index);
                            }
                        });
                    }, true);

                    $scope.isDefault = function () {
                        return angular.equals($scope.defaultparams, $scope.model);
                    };
                    $scope.idxOfList = function (Arr, elm) {
                        var ret = Arr.indexOf(elm);
                        if (ret >= 0 ) {
                           return ret;
                        } else { 
                           ret = 0;
                           for (var k in Arr){
                              if (angular.equals(elm,Arr[k]))  {
                                 return ret;
                              }
                              ret += 1;
                           }
                           return -1;
                        }
                    };
                    $scope.searchParamValueChanged = function (param) {
                        updateModel('change', param.key, param.value);
                    };

                    $scope.searchQueryChanged = function (query) {
                        updateModel('change', 'query', query);
                    };

                    $scope.enterEditMode = function(index) {
                        if (index === undefined)
                            return;

                        var searchParam = $scope.searchParams[index];
                        searchParam.editMode = true;
                        $scope.focus = true; // by GatorLiu
                    };

                    $scope.leaveEditMode = function(index) {
                        if (index === undefined)
                            return;

                        var searchParam = $scope.searchParams[index];
                        searchParam.editMode = false;

                        // remove empty search params
                        if (!searchParam.value)
                            $scope.removeSearchParam(index);
                    };

                    $scope.typeaheadOnSelect = function (item, model, label) {
                        $scope.addSearchParam(item);
                        $scope.searchQuery = '';
                        updateModel('delete', 'query');
                    };

                    $scope.isUnsedParameter = function (value, index) {
                        return $filter('filter')($scope.searchParams, function (param) { return param.key === value.key; }).length === 0;
                    };

                    $scope.addSearchParam = function (searchParam, value, enterEditModel) {
                        if (enterEditModel === undefined)
                            enterEditModel = true;

                        if (!$scope.isUnsedParameter(searchParam))
                            return;

                        $scope.searchParams.push(
                            {
                                key: searchParam.key,
                                name: searchParam.name,
                                placeholder: searchParam.placeholder,
                                type: searchParam.type, // GatorLiu
                                options : searchParam.options, // GatorLiu
                                required:searchParam.required,
                                value: value || '',
                                editMode: enterEditModel
                            }
                        );
                        if (value === undefined) {
                           $timeout( function(){
                              $scope.focus = true;
                           });
                        }
                        updateModel('add', searchParam.key, value);
                    };

                    $scope.removeSearchParam = function (index) {
                        if (index === undefined)
                            return;

                        var searchParam = $scope.searchParams[index];
                        if (searchParam.required) return;
                        $scope.searchParams.splice(index, 1);

                        updateModel('delete', searchParam.key);
                    };

                    $scope.removeAll = function() {
                        $scope.searchParams.length = 0;
                        $scope.searchQuery = '';
                        
                        $scope.model = {};
                        $scope.model= angular.copy($scope.defaultparams);
                        $scope.focus = false;
                    };

                    $scope.editPrevious = function(currentIndex) {
                        //if (currentIndex !== undefined)
                        //    $scope.leaveEditMode(currentIndex);

                        //TODO: check if index == 0 -> what then?
                        //console.log(currentIndex)
                        if (currentIndex === undefined && $scope.searchParams.length > 0) {
                            $scope.enterEditMode($scope.searchParams.length - 1);
                        } else if (currentIndex > 0) {
                            $scope.enterEditMode(currentIndex - 1);
                        //} else if (currentIndex === undefined) {
                        //    $scope.enterEditMode($scope.searchParams.length - 1);
                        } else if ($scope.searchParams.length > 0) {
                            $scope.setSearchFocus = true;
                        }
                    };

                    $scope.editNext = function(currentIndex) {
                        if (currentIndex === undefined) {
                            return;
                        }

                        $scope.leaveEditMode(currentIndex);

                        //TODO: check if index == array length - 1 -> what then?
                        if (currentIndex < $scope.searchParams.length - 1) {
                            $scope.enterEditMode(currentIndex + 1);
                        } else {
                            $scope.setSearchFocus = true;
                        }
                    };

                    $scope.keydown = function(e, searchParamIndex) {
                        var handledKeys = [8, 9, 13, 37, 39];
                        if (handledKeys.indexOf(e.which) === -1)
                            return;
/* 
 * Most browsers( IE, firefox, safari..) not suport html5 input type 'date',
                        if (e.target.type == 'date'){
                           if (e.which == 13) { // enter
                              $scope.editNext(searchParamIndex);
                           }
                           return;
                        }
*/
                        var notSupportType;
                        var cursorPosition;
                        try{
                           notSupportType  = false;
                           cursorPosition = getCurrentCaretPosition(e.target);
                        } catch(err) {
                           notSupportType = true; 
                        }

                        if (e.which == 8) { // backspace
                            if ( notSupportType || cursorPosition === 0) {
                                e.preventDefault();
                                if (searchParamIndex === 0)
                                    $scope.editNext(searchParamIndex);
                                else
                                    $scope.editPrevious(searchParamIndex);
                            }

                        } else if (e.which == 9) { // tab
                            if (e.shiftKey) {
                                e.preventDefault();
                                $scope.editPrevious(searchParamIndex);
                            } else {
                                e.preventDefault();
                                $scope.editNext(searchParamIndex);
                            }

                        } else if (e.which == 13) { // enter
                            $scope.editNext(searchParamIndex);

                        } else if (e.which == 37) { // left
                            if (cursorPosition === 0)
                                $scope.editPrevious(searchParamIndex);

                        } else if (e.which == 39) { // right
                            if (cursorPosition === e.target.value.length)
                                $scope.editNext(searchParamIndex);
                        }
                    };

                    function restoreModel() {
                        angular.forEach($scope.model, function (value, key) {
                            if (key === 'query') {
                                $scope.searchQuery = value;
                            } else {
                                var searchParam = $filter('filter')($scope.parameters, function (param) { return param.key === key; })[0];
                                if (searchParam !== undefined)
                                    $scope.addSearchParam(searchParam, value, false);
                            }
                        });
                    }

                    if ($scope.model === undefined) {
                        $scope.model = {};
                    } else {
                        restoreModel();
                    }

                    function updateModel(command, key, value) {
                        if (searchThrottleTimer)
                            $timeout.cancel(searchThrottleTimer);

                        // remove all previous entries to the same search key that was not handled yet
                        changeBuffer = $filter('filter')(changeBuffer, function (change) { return change.key !== key; });
                        // add new change to list
                        changeBuffer.push({
                            command: command,
                            key: key,
                            value: value
                        });

                        searchThrottleTimer = $timeout(function () {
                            angular.forEach(changeBuffer, function (change) {
                                if(change.command === 'delete')
                                    delete $scope.model[change.key];
                                else
                                    $scope.model[change.key] = change.value;
                            });

                            changeBuffer.length = 0;
                            //$scope.focus = true; // by GatorLiu for <select> Click 
                        }, 500);
                    }

                    function getCurrentCaretPosition(input) {
                        if (!input)
                            return 0;

                        // Firefox & co
                        if (typeof input.selectionStart === 'number') {
                            return input.selectionDirection === 'backward' ? input.selectionStart : input.selectionEnd;

                        } else if (document.selection) { // IE
                            input.focus();
                            var selection = document.selection.createRange();
                            var selectionLength = document.selection.createRange().text.length;
                            selection.moveStart('character', -input.value.length);
                            return selection.text.length - selectionLength;
                        }

                        return 0;
                    }
                }
            ]
        };
    })
    .directive('nitSetFocus', [
        '$timeout', '$parse',
        function($timeout, $parse) {
            return {
                restrict: 'A',
                link: function($scope, $element, $attrs) {
                    var model = $parse($attrs.nitSetFocus);
                    $scope.$watch(model, function(value) {
                        if (value === true) {
                            $timeout(function() {
                                $element[0].focus();
                            });
                        }
                    });
                    $element.bind('blur', function() {
                       try {
                           if ($attrs.name != 'searchbox') {
                              var index = $scope.searchParams.length-1;
                              var searchParam= $scope.searchParams[$scope.searchParams.length-1];
                              if (!searchParam.value)
                                 $scope.removeSearchParam(index);
                           }
                       } catch (e) {}

                        $scope.$apply(model.assign($scope, false));
                    });
                }
            };
        }
    ])
    .directive('nitAutoSizeInput', [
        function() {
            return {
                restrict: 'A',
                scope: {
                    model: '=ngModel'
                },
                link: function($scope, $element, $attrs) {
                    var container = angular.element('<div style="position: fixed; top: -9999px; left: 0px;"></div>');
                    var shadow = angular.element('<span style="white-space:pre;"></span>');

                    var maxWidth = $element.css('maxWidth') === 'none' ? $element.parent().innerWidth() : $element.css('maxWidth');
                    $element.css('maxWidth', maxWidth);

                    angular.forEach([
                        'fontSize', 'fontFamily', 'fontWeight', 'fontStyle',
                        'letterSpacing', 'textTransform', 'wordSpacing', 'textIndent',
                        'boxSizing', 'borderLeftWidth', 'borderRightWidth', 'borderLeftStyle', 'borderRightStyle',
                        'paddingLeft', 'paddingRight', 'marginLeft', 'marginRight'
                    ], function(css) {
                        shadow.css(css, $element.css(css));
                    });

                    angular.element('body').append(container.append(shadow));

                    function resize() {
                        shadow.text($element.val() || $element.attr('placeholder'));
                        $element.css('width', shadow.outerWidth() + 10);
                    }

                    resize();

                    if ($scope.model) {
                        $scope.$watch('model', function() { resize(); });
                    } else {
                        $element.on('keypress keyup keydown focus input propertychange change', function() { resize(); });
                    }
                }
            };
        }
    ]);
})();

angular.module('angular-advanced-searchbox').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('angular-advanced-searchbox.html',
    "<div class=advancedSearchBox ng-class={active:focus} ng-init=\"focus = false\" ng-click=\"!focus ? setSearchFocus = true : null\"><form ng-submit=Enter()><span ng-show=\"isDefault() && searchQuery.length === 0\" class=\"search-icon fa fa-search\"></span> <a ng-href=\"\" ng-hide=\"isDefault() && searchQuery.length === 0\" ng-click=removeAll() role=button><span class=\"remove-all-icon fa fa-refresh\"></span></a><div><div class=search-parameter ng-repeat=\"searchParam in searchParams\"><a ng-href=\"\" ng-click=removeSearchParam($index) role=button ng-hide=searchParam.required><span class=\"remove fa fa-trash\"></span></a> <a ng-href=\"\" ng-click=\"\" role=button ng-show=searchParam.required><span class=remove></span></a><div class=key>{{searchParam.name}}:</div><div class=value ng-if=\"searchParam.type != 'list'\"><span ng-if=!searchParam.editMode ng-click=enterEditMode($index)>&nbsp;{{(searchParam.type == 'date') ? (searchParam.value| date: \"yyyy-MM-dd\"): searchParam.value}}</span> <input name=value type={{searchParam.type}} ng-model-options=\"{ timezone: '+0000' }\" nit-set-focus=searchParam.editMode ng-keydown=\"keydown($event, $index)\" ng-blur=leaveEditMode($index) ng-if=searchParam.editMode ng-change=searchParamValueChanged(searchParam) ng-model=searchParam.value placeholder=\"{{searchParam.placeholder}}\"></div><div class=value ng-if=\"searchParam.type == 'list'\"><span ng-if=!searchParam.editMode ng-click=enterEditMode($index)>&nbsp;{{searchParam.value.cname || searchParam.value.name}}</span><select nit-set-focus=searchParam.editMode ng-keydown=\"keydown($event, $index)\" ng-blur=leaveEditMode($index) ng-if=searchParam.editMode ng-change=searchParamValueChanged(searchParam) ng-model=searchParam.value ng-options=\"m.cname || m.name for m in searchParam.options\" ng-init=\"searchParam.value = searchParam.options[idxOfList(searchParam.options, searchParam.value)]\"></div></div><input name=searchbox class=search-parameter-input nit-auto-size-input nit-set-focus=setSearchFocus ng-keydown=keydown($event) placeholder={{placeholder}} ng-focus=\"focus = true\" ng-blur=\"focus = false\" typeahead-on-select=\"typeaheadOnSelect($item, $model, $label)\" typeahead=\"parameter as parameter.name for parameter in parameters | filter:isUnsedParameter | filter:{name:$viewValue} | limitTo:8\" ng-change=searchQueryChanged(searchQuery) ng-model=\"searchQuery\"></div><div class=search-parameter-suggestions ng-show=\"(parameters | filter:isUnsedParameter).length && focus\"><span class=title>Parameter Suggestions:</span> <span class=search-parameter ng-repeat=\"param in parameters | filter:isUnsedParameter | limitTo:8\" ng-mousedown=addSearchParam(param)>{{param.name}}</span></div></form></div>"
  );


  $templateCache.put('test.html',
    "<!DOCTYPE html><html ng-app=app lang=en id=top><head><meta charset=utf-8><meta http-equiv=X-UA-Compatible content=\"IE=edge\"><meta name=viewport content=\"width=device-width,initial-scale=1\"><meta name=description content=\"A directive for AngularJS providing a advanced visual search box\"><meta name=author content=\"Gator Liu\"><link rel=icon href=favicon.ico><title>Another Angular Advanced Searchbox</title><link rel=stylesheet href=https://maxcdn.bootstrapcdn.com/bootstrap/3.3.1/css/bootstrap.min.css><link rel=stylesheet href=https://maxcdn.bootstrapcdn.com/bootstrap/3.3.1/css/bootstrap-theme.min.css><link rel=stylesheet href=https://maxcdn.bootstrapcdn.com/font-awesome/4.2.0/css/font-awesome.min.css><link rel=stylesheet href=angular-advanced-searchbox.css><script src=http://code.jquery.com/jquery-2.1.1.min.js></script><script src=https://ajax.googleapis.com/ajax/libs/angularjs/1.4.3/angular.min.js></script><script src=https://rawgit.com/angular-ui/bootstrap/gh-pages/ui-bootstrap-tpls-0.13.0.min.js></script><script src=angular-advanced-searchbox.js></script><script>var app = angular.module('app', ['ui.bootstrap', 'angular-advanced-searchbox']);\n" +
    "\n" +
    "\n" +
    "      app.controller('DemoController', function($scope, $filter) {\n" +
    "        $scope.availableSearchParams = [\n" +
    "          { key: \"name\", name: \"Name\", placeholder: \"Name...\" },\n" +
    "          { key: \"city\", name: \"City\", type:\"list\", options: [{id:'ny', name:'New York'}, {id:'tp', name:'Taipei'}], required:true },\n" +
    "          { key: \"emailAddress\", name: \"E-Mail\", placeholder: \"E-Mail...\" },\n" +
    "          { key: \"job\", name: \"Job\", placeholder: \"Job...\" },\n" +
    "          { key: \"sd\", name: \"Start Date\", placeholder: \"sds\", type:\"date\", required:true },\n" +
    "          { key: \"ed\", name: \"End Date\", placeholder: \"eds\", type:\"date\" }\n" +
    "        ];\n" +
    "          $scope.defaultParams = {\n" +
    "            name: \"Max M.\",\n" +
    "            city: {id:'tp', name:'Taipei'},\n" +
    "            sd: new Date($filter(\"date\")(Date.now(), 'yyyy-MM-dd'))\n" +
    "            };\n" +
    "          $scope.search = function() {\n" +
    "            alert(\"do search....:\\n  search_key = \" + JSON.stringify($scope.searchParams)  );\n" +
    "          };\n" +
    "\n" +
    "        $scope.addPredefinedNameSearchParam = function(){\n" +
    "          $scope.searchParams.name = 'Max Mustermann';\n" +
    "        };\n" +
    "\n" +
    "        $scope.loadPredefinedSearchParamSet = function(){\n" +
    "          $scope.defaultParams = {\n" +
    "            name: \"Max M.\",\n" +
    "            city: {id:'tp', name:'Taipei'},\n" +
    "            sd: new Date($filter(\"date\")(Date.now(), 'yyyy-MM-dd'))\n" +
    "          };\n" +
    "        };\n" +
    "      \n" +
    "      });</script></head><body><nav class=\"navbar navbar-inverse navbar-fixed-top\" role=navigation><div class=container><div class=navbar-header><a class=navbar-brand href=#top>Another Angular Advanced Searchbox</a></div><div id=navbar class=\"navbar-collapse collapse\"></div></div></nav><div class=container ng-controller=DemoController><div class=jumbotron><h1>Another Angular Advanced Searchbox</h1><p>A directive for AngularJS providing a advanced visual search box.<br><small>Forked from <a href=https://github.com/dnauck/angular-advanced-searchbox target=_blank>Dnauck's project</a> and added some features.</small></p><form target=paypal action=https://www.paypal.com/cgi-bin/webscr method=post name=donateform><a class=\"btn btn-primary btn-lg\" href=https://github.com/gatorliu/angular-advanced-searchbox/archive/master.zip role=button><span class=\"fa fa-download\"></span> Download</a> <a class=\"btn btn-default btn-lg\" href=https://github.com/gatorliu/angular-advanced-searchbox role=button><span class=\"fa fa-github\"></span> Github</a> <input type=hidden name=cmd value=_s-xclick> <input type=hidden name=hosted_button_id value=5R3T7PLQSAY9E> <a class=\"btn btn-default btn-lg\" href=\"javascript: document.donateform.submit()\" role=button><span class=\"fa fa-paypal\"></span> Donate</a> <img alt=\"\" border=0 src=https://www.paypalobjects.com/en_US/i/scr/pixel.gif width=1 height=1></form></div><div class=row><div class=col-sm-12><h2>Demo</h2><p>Click on a suggested search parameter or use autocompletion feature and press 'Enter' to add new search parameter to your query. Use 'TAB', 'SHIFT+TAB', 'LEFT', 'RIGHT' or 'BACKSPACE' to navigate between search parameters. Using 'Enter' to Submit.</p><nit-advanced-searchbox ng-model=searchParams parameters=availableSearchParams defaultparams=defaultParams placeholder=Search... enter=search></nit-advanced-searchbox><p><strong>Output:</strong><pre><code>{{searchParams}}</code></pre>The output model could be directly used as params object for Angular's $http API.</p><p><strong>Test:</strong> loading predefined search parameters via code:<br><button class=\"btn btn-info\" ng-click=addPredefinedNameSearchParam()>Add predefined \"Name\" Search Parameter</button> <button class=\"btn btn-info\" ng-click=loadPredefinedSearchParamSet()>Load predefined Search Parameter Set</button></p></div><div class=col-sm-12><h2>Getting started</h2><p>Define the available search parameters in your controller's code:</p><p><pre><code>\n" +
    "$scope.availableSearchParams = [\n" +
    "   { key: \"name\", name: \"Name\", placeholder: \"Name...\" },\n" +
    "   { key: \"city\", name: \"City\", type:\"list\", options: [{id:'ny', name:'New York'}, {id:'tp', name:'Taipei'}], required:true },\n" +
    "   { key: \"emailAddress\", name: \"E-Mail\", placeholder: \"E-Mail...\" },\n" +
    "   { key: \"job\", name: \"Job\", placeholder: \"Job...\" },\n" +
    "   { key: \"sd\", name: \"Start Date\", placeholder: \"sds\", type:\"date\", required:true },\n" +
    "   { key: \"ed\", name: \"End Date\", placeholder: \"eds\", type:\"date\", required:true }\n" +
    "];\n" +
    " $scope.defaultParams = {\n" +
    "   name: \"Max M.\",\n" +
    "   city: {id:'tp', name:'Taipei'},\n" +
    "   sd: new Date($filter(\"date\")(Date.now(), 'yyyy-MM-dd'))\n" +
    "   };\n" +
    " $scope.search = function() {\n" +
    "   alert(\"do search....:\\n  search_key = \" + JSON.stringify($scope.searchParams)  );\n" +
    " }:\n" +
    "            </code></pre></p><p>Add the following AngularJS directive to your HTML:</p><p><pre><code>&#60;nit-advanced-searchbox\n" +
    "            ng-model=\"searchParams\"\n" +
    "            parameters=\"availableSearchParams\"\n" +
    "            defaultparams=\"defaultParams\"\n" +
    "            placeholder=\"Search...\" \n" +
    "            enter=\"search\"\n" +
    "            &#62;\n" +
    "&#60;/nit-advanced-searchbox&#62; </code></pre></p><p><a class=\"btn btn-primary\" href=https://github.com/gatorliu/angular-advanced-searchbox/blob/master/README.md role=button>View Readme &raquo;</a></p></div></div><hr><footer><p>&copy; Gator Liu 2015</p></footer></div></body></html>"
  );

}]);
