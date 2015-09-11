## Another Angular Advanced Searchbox

A directive for AngularJS providing a advanced visual search box  
Forked from [Dnauck's project](https://github.com/dnauck/angular-advanced-searchbox) 
and added some features.

### [DEMO](http://gatorliu.github.io/angular-advanced-searchbox/)

### New Features
1. add `required` attribute in availableSearchParams ( also must set defaultParams)
1. add `type` attribute in availableSearchParams ( type may one of  `text`, `list`, `date`)
   * date type only work Chrome and IE11+ (HTML5 input type date support)

### Usage

```html
<link rel="stylesheet" href="bower_components/angular-advanced-searchbox/dist/angular-advanced-searchbox.min.css">
<script src="bower_components/angular-advanced-searchbox/dist/angular-advanced-searchbox-tpls.min.js"></script>
```

```js
angular.module('myModule', ['angular-advanced-searchbox']);
```

Define the available search parameters in your controller:

```js
$scope.availableSearchParams = [
          { key: "name", name: "Name", placeholder: "Name..." },
          { key: "city", name: "City", type:"list", options: [{id:'ny', name:'New York'}, {id:'tp', name:'Taipei'}], required:true },
          { key: "emailAddress", name: "E-Mail", placeholder: "E-Mail..." },
          { key: "job", name: "Job", placeholder: "Job..." },
          { key: "sd", name: "Start Date", placeholder: "sds", type:"date", required:true },
          { key: "ed", name: "End Date", placeholder: "eds", type:"date", required:true }
];
$scope.defaultParams = {
   name: "Max M.",
   city: {id:'tp', name:'Taipei'},
   sd: new Date($filter("date")(Date.now(), 'yyyy-MM-dd'))
};
$scope.search = function() {
   alert("do search....");
};

```

Then in your view

```html
<nit-advanced-searchbox
	ng-model="searchParams"
	parameters="availableSearchParams"
	placeholder="Search..."
	enter="search">
</nit-advanced-searchbox>
```
