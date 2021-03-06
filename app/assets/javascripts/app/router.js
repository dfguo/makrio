app.Router = Backbone.Router.extend({
  routes: {
    "" : "rootPage",
    "?*params" : "rootPage",

    //new hotness
    "latest": "newStream",
    "latest?*params": "newStream",


    "search/:query": "search",
    "search/:query?*params": "search",

    "people/:id": "newProfile",
    "u/:name": "newProfile",

    "front_page": "frontPage",
    "interests": "interests",
    "likes": "likes",
    "staff_picks": "staffPicks",

    "posts/:id/remix?*params" : 'remix', // facebook action links supply signed_request params
    "posts/:id/remix" : 'remix',
    "posts/new" : "redirectToFramer",

    'timewarp' : 'timewarp',
    'timewarp/:days_ago' : 'timewarp',
    'timewarp?:days_ago' : 'timewarp',

    "framer": "framer",
    "framer?bookmarklet=true&*params": "bookmarklet", 
    "framer/done/:id" : "doneFraming",

    "posts/:id?:params": "singlePost",
    "posts/:id": "singlePost",
    "posts/:id/frame": "singlePostFrame",
    "posts/:id/styleguide": "styleGuide",
    "p/:id?:params": "singlePost",
    "p/:id": "singlePost",

    "posts/:id/next": "siblingPost",
    "posts/:id/previous": "siblingPost",

    "conversations/:id" : "conversation",
    "conversations": "conversations",
    
    'tagged/:name' : 'tagShow',
    'topic/:name' : 'tagShow',

    'top_tags' : 'topTags',
    'topics' : 'topTags',

    'about' : 'about',
    'pro_tips' : 'proTips',
    ":name" : "newProfile"
  },

  redirectToFramer : function(){
    app.router.navigate("/framer", true)
  },

  about : function(){
    this.renderPage(function(){ return new app.pages.About()});
  },

  proTips : function(){
    this.renderPage(function(){ return new app.pages.ProTips()});
  },
  
  interests : function(){
    app.instrument("track", "Track Interests")

    app.onInterests = true
    this.genericCanvas({title:'My Stream', description: "personalized just for you"})
  },

  timewarp : function(daysAgo){
    this.renderPage(function(){ return new app.pages.TimeWarp({daysAgo : daysAgo})});
  },

  topTags : function(){
    app.instrument("track", "Top Tags Loaded")
    this.renderPage(function(){ return new app.pages.TopTags()});
  },

  styleGuide : function(id){
    var model = new app.models.Post({ id : id })
      , self = this;

    model.preloadOrFetch()
      .done(function(resp){
        self.renderPage(function(){ return new app.pages.StyleGuide({model: resp}) })
      })
  },

  conversations : function(){
    app.instrument("track", "Conversations index loaded")
    this.renderPage(function(){ return new app.pages.ConversationsIndex()});
  },

  conversation : function() {
    app.instrument("track", "Conversation loaded")
    this.renderPage(function(){ return new app.pages.Conversations()});
  },

  likes : function() {
    app.instrument("track", "Likes loaded")

    this.genericCanvas({
      title : "My Likes"
    })
  },

  rootPage : function(params) {
    var campaign = (params && params.split('campaign=')[1])
    if(campaign) {
      app.instrument("track", "Campaign", {
        Name : campaign
      })
    }

    app.onRoot = true
    this.frontPage()
  },

  genericCanvas : function(options){
    this.renderPage(function(){
      return new app.pages.GenericCanvas(options)
    })
  },

  staffPicks : function() {
    app.onStaffPicks = true;
    this.genericCanvas({
      title : "Staff Picks"
    })
  },

  frontPage : function() {
    app.instrument("track", "Front Page loaded")
    this.genericCanvas({
      title : "Front Page",
      description : "Recently popular posts"
    })
  },

  newStream : function() {
    app.instrument("track", "Stream loaded")

    var wantsCanvas = window.location.search.search('canvas') != -1
      , page = wantsCanvas ? new app.pages.GenericCanvas() : new app.pages.Stream()
    
    this.renderPage(function(){ return page});
  },

  search : function(){
    this.renderPage(function(){ return new app.pages.Search()});
  },

  remix : function(id){
    var remixed = new app.models.StatusMessage({id : id})
    remixed.fetch().success(_.bind(function(){
      var new_mix = remixed.buildRemix()

      this.renderPage(function(){ return new app.pages.Framer({model : new_mix })});
    }, this)).fail(function(){alert('There was an error loading the Remix. Please Try Refreshing.')});
  },

  newProfile : function(personId) {
    app.onProfilePage = true;
    this.renderPage(function(){ return new app.pages.Profile({ personId : personId })});
  },

  bookmarklet : function(params) {
    var url = params.split('&')[0].replace('remoteurl=', '')
    app.remotePhotoUrl  = decodeURIComponent(url)
    this.framer()
  },

  doneFraming : function(id){
    this.renderPage(function(){ return new app.pages.DoneFraming({ model_id : id})});
  },

  framer : function(){
    app.instrument("track", "Compose")
    this.renderPage(function(){ return new app.pages.Framer()});
  },

  singlePost : function(id) {
    this.renderPage(function(){ return new app.pages.PostViewer({ id: id })});
  },

  singlePostFrame : function(id) {
    var model = new app.models.Post({ id : id })
      , self = this;

    model.preloadOrFetch()
      .done(function(resp){
        self.renderPage(function(){ return new app.pages.SinglePostFrame({model: resp}) })
      })
  },
  
  siblingPost : function(){ //next or previous
    var post = new app.models.Post();
    post.bind("change", setPreloadAttributesAndNavigate)
    post.fetch({url : window.location})

    function setPreloadAttributesAndNavigate(){
      window.preloads.post = post.attributes
      app.router.navigate(post.url(), {trigger:true, replace: true})
    }
  },

  renderPage : function(pageConstructor){
    app.page && app.page.unbind && app.page.unbind() //old page might mutate global events $(document).keypress, so unbind before creating
    app.page = pageConstructor() //create new page after the world is clean (like that will ever happen)
    $("#container").html(app.page.render().el)
    $(window).scrollTop(0)
  },

  setLocation : function(location){
    //I made this so we can stub it out nicely
    window.location = location
  },

  tagShow : function(name){
    app.instrument("track", "Topic Loaded", {
      Name : name
    })
    this.renderPage(function(){ return new app.pages.TagsShow({name : name})});
  },
  
  category : function(name){
    this.genericCanvas();
  }
});
