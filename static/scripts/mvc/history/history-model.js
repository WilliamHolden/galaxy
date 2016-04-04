define(["mvc/history/history-contents","mvc/history/history-preferences","mvc/base/controlled-fetch-collection","utils/utils","mvc/base-mvc","utils/localization"],function(a,b,c,d,e){"use strict";var f=Backbone.Model.extend(e.LoggableMixin).extend(e.mixin(e.SearchableModelMixin,{_logNamespace:"history",UPDATE_DELAY:4e3,defaults:{model_class:"History",id:null,name:"Unnamed History",state:"new",deleted:!1,contents_shown:{}},urlRoot:Galaxy.root+"api/histories",initialize:function(b,c,d){d=d||{},this.logger=d.logger||null,this.log(this+".initialize:",b,c,d),this.contents=new a.HistoryContents(c||[],{historyId:this.get("id"),order:d.order}),this._setUpListeners(),this._setUpCollectionListeners(),this.updateTimeoutId=null},_setUpListeners:function(){return this.on({error:function(){this.clearUpdateTimeout()},"change:id":function(a,b){this.contents&&(this.contents.historyId=b)}})},_setUpCollectionListeners:function(){return this.contents?this.listenTo(this.contents,{error:function(){this.trigger.apply(this,jQuery.makeArray(arguments))}}):this},nice_size:function(){return d.bytesToString(this.get("size"),!0,2)},toJSON:function(){return _.extend(Backbone.Model.prototype.toJSON.call(this),{nice_size:this.nice_size()})},get:function(a){return"nice_size"===a?this.nice_size():Backbone.Model.prototype.get.apply(this,arguments)},ownedByCurrUser:function(){return Galaxy&&Galaxy.user?Galaxy.user.isAnonymous()||Galaxy.user.id!==this.get("user_id")?!1:!0:!1},numOfUnfinishedJobs:function(){var a=this.get("non_ready_jobs");return a?a.length:0},numOfUnfinishedShownContents:function(){return this.contents.running().visibleAndUndeleted().length||0},searchAttributes:["name","annotation","tags"],searchAliases:{title:"name",tag:"tags"},_getSizeAndRunning:function(){return this.fetch({data:$.param({keys:"size,non_ready_jobs"})})},refresh:function(a){a=a||{};var b=this,c=b.lastUpdateTime;return b.lastUpdateTime=new Date,this.contents.allFetched=!1,b.contents.fetchUpdated(c).done(_.bind(b.checkForUpdates,b))},checkForUpdates:function(a){function b(){d.clearUpdateTimeout(),d.updateTimeoutId=setTimeout(function(){d.refresh(a)},c)}a=a||{};var c=this.UPDATE_DELAY,d=this;if(d.id){var e=this.numOfUnfinishedShownContents();e>0?b():d._getSizeAndRunning().done(function(){d.numOfUnfinishedJobs()>0?b():d.trigger("ready")})}},clearUpdateTimeout:function(){this.updateTimeoutId&&(clearTimeout(this.updateTimeoutId),this.updateTimeoutId=null)},parse:function(a,b){var c=Backbone.Model.prototype.parse.call(this,a,b);return c.create_time&&(c.create_time=new Date(c.create_time)),c.update_time&&(c.update_time=new Date(c.update_time)),c},fetchWithContents:function(a,b){a=a||{};var c=this;return a.view="current",this.fetch(a).pipe(function(a){return c.contents.historyId=a.id,c.fetchContents(b)})},fetchContents:function(a){a=a||{};var c=this,d=b.HistoryPrefs.get(c.id).toJSON();return c.contents.includeDeleted=d.show_deleted,c.contents.includeHidden=d.show_hidden,c.lastUpdateTime=new Date,c.contents.fetchFirst(a)},_delete:function(a){return this.get("deleted")?jQuery.when():this.save({deleted:!0},a)},purge:function(a){return this.get("purged")?jQuery.when():this.save({deleted:!0,purged:!0},a)},undelete:function(a){return this.get("deleted")?this.save({deleted:!1},a):jQuery.when()},copy:function(a,b,c){if(a=void 0!==a?a:!0,!this.id)throw new Error("You must set the history ID before copying it.");var d={history_id:this.id};a&&(d.current=!0),b&&(d.name=b),c||(d.all_datasets=!1),d.view="current";var e=this,g=jQuery.post(this.urlRoot,d);return a?g.then(function(a){var b=new f(a);return b.setAsCurrent().done(function(){e.trigger("copied",e,a)})}):g.done(function(a){e.trigger("copied",e,a)})},setAsCurrent:function(){var a=this,b=jQuery.getJSON(Galaxy.root+"history/set_as_current?id="+this.id);return b.done(function(){a.trigger("set-as-current",a)}),b},toString:function(){return"History("+this.get("id")+","+this.get("name")+")"}})),g=c.PaginatedCollection,h=g.extend(e.LoggableMixin).extend({_logNamespace:"history",model:f,order:"update_time",limitOnFirstFetch:10,limitPerFetch:10,initialize:function(a,b){b=b||{},this.log("HistoryCollection.initialize",a,b),g.prototype.initialize.call(this,a,b),this.includeDeleted=b.includeDeleted||!1,this.currentHistoryId=b.currentHistoryId,this.setUpListeners()},urlRoot:Galaxy.root+"api/histories",url:function(){return this.urlRoot},setUpListeners:function(){return this.on({"change:deleted":function(a){this.debug("change:deleted",this.includeDeleted,a.get("deleted")),!this.includeDeleted&&a.get("deleted")&&this.remove(a)},copied:function(a,b){this.setCurrent(new f(b,[]))},"set-as-current":function(a){var b=this.currentHistoryId;this.trigger("no-longer-current",b),this.currentHistoryId=a.id}})},_buildFetchData:function(a){return _.extend(g.prototype._buildFetchData.call(this,a),{view:"current"})},_buildFetchFilters:function(a){var b=g.prototype._buildFetchFilters.call(this,a)||{},c={};return this.includeDeleted?c.deleted=null:(c.deleted=!1,c.purged=!1),_.defaults(b,c)},comparators:_.extend(_.clone(g.prototype.comparators),{name:e.buildComparator("name",{ascending:!0}),"name-dsc":e.buildComparator("name",{ascending:!1}),size:e.buildComparator("size",{ascending:!1}),"size-asc":e.buildComparator("size",{ascending:!0})}),sort:function(a){a=a||{};var b=a.silent,c=this.remove(this.get(this.currentHistoryId));return g.prototype.sort.call(this,_.defaults({silent:!0},a)),this.unshift(c,{silent:!0}),b||this.trigger("sort",this,a),this},create:function(a,b,c){var d=this,e=jQuery.getJSON(Galaxy.root+"history/create_new_current");return e.done(function(a){d.setCurrent(new f(a,[],c||{}))})},setCurrent:function(a,b){return b=b||{},this.unshift(a,b),this.currentHistoryId=a.get("id"),b.silent||this.trigger("new-current",a,this),this},toString:function(){return"HistoryCollection("+this.length+",current:"+this.currentHistoryId+")"}});return window.HistoryCollection=h,{History:f,HistoryCollection:h}});
//# sourceMappingURL=../../../maps/mvc/history/history-model.js.map