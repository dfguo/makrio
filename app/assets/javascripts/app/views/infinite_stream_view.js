// Abstract Infinite Scroll View Super Class
//  Requires:
//    a stream model, assigned to this.stream
//    a stream's posts, assigned to this.collection
//    a postClass to be declared
//    a #paginate div in the layout
//    a call to setupInfiniteScroll

app.views.InfScroll = app.views.Base.extend({
  scrollOffset : 2000,

  setupInfiniteScroll : function() {
    this.postViews = this.postViews || []
    this.resetViewBuffer()
    this.bind("loadMore", this.fetchAndshowLoader, this)
    this.stream.bind("fetched", this.hideLoader, this)
    this.stream.bind("fetched", this.addPosts, this)
    this.stream.bind("allItemsLoaded", this.unbindInfScroll, this)

    this.collection.bind("add", this.addPostView, this);

    var throttledScroll = _.throttle(_.bind(this.infScroll, this), 200);
    $(window).on('scroll', throttledScroll)
  },

  postRenderTemplate : function() {
    if(this.stream.isFetching()) { this.showLoader() }
  },

  createPostView : function(post){
    var postView = new this.postClass({ model: post, stream: this.stream });
    this.postViews.push(postView)
    return postView
  },

  addPostView : function(post) {
    //if this is prepend, do it eagarly, if not, use the buffer :(
    var placeInStream = (this.collection.at(0).id == post.id) ? "prepend" : "append"
      , postView = this.createPostView(post)
    postView.render()

    if(placeInStream == 'prepend'){
      this.$el[placeInStream](postView.el);
    } else{
      this.addToViewBuffer(postView.el)
    }
  },

  addPosts : function(){
    this.$el.append(this.flushViewBuffer())
  },

  flushViewBuffer : function(){
    var posts = this._viewBuffer
    this.resetViewBuffer()

    return posts
  },

  resetViewBuffer : function(){
    this._viewBuffer = []
  },

  addToViewBuffer : function(item){
    this._viewBuffer.push(item)
  },

  unbindInfScroll : function() {
    $(window).unbind("scroll");
  },

  renderTemplate : function(){
    this.renderInitialPosts()
  },

  renderInitialPosts : function(){
    this.$el.empty()

    var firstFrame = new app.views.Post.FirstCanvasFrame()
    if(firstFrame.onTagPage() != -1){
      this.$el.append(firstFrame.render().el)
    }

    this.stream.items.each(_.bind(function(post){
      this.$el.append(this.createPostView(post).render().el);
    }, this))
  },

  fetchAndshowLoader : function(){
    if(this.stream.isFetching()) { return false }
    this.resetViewBuffer()
    this.stream.fetch()
    this.showLoader()
  },

  showLoader: function(){
    $("#paginate .loader").removeClass("hidden")
  },

  hideLoader: function() {
    $("#paginate .loader").addClass("hidden")
  },

  infScroll : function() {
    var $window = $(window)
      , distFromTop = $window.height() + $window.scrollTop()
      , distFromBottom = $(document).height() - distFromTop
      , bufferPx = this.scrollOffset;

    if(distFromBottom < bufferPx) {
      this.trigger("loadMore")
    }
  }
});
