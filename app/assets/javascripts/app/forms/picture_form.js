app.forms.PictureBase = app.views.Base.extend({
  events : {
    'ajax:complete .new_photo' : "photoUploaded",
    "change input[name='photo[user_file]']" : "submitUpload",
    "click .img-url" : "submitURL"
  },

  onSubmit : $.noop,
  uploadSuccess : $.noop,

  postRenderTemplate : function(){
    this.$("input[name=authenticity_token]").val($("meta[name=csrf-token]").attr("content"))
  },

  submitUpload : function (){
    this.requireAuth(); //the file picker thing doesnt allow for normal binding of this.
    this.$("form").submit();
    this.onSubmit();
  },

  submitURL : function(evt){
    evt && evt.preventDefault()
    if(this.$("form input[name='photo[image_url]']").val()){
      this.submitUpload();
    } 
  },

  photoUploaded : function(evt, xhr) {
    resp = JSON.parse(xhr.responseText)
    if(resp.success) {
      this.uploadSuccess(resp)
    } else {
      alert("Upload failed!  Check your URL. Error:" + resp.error);
      this.render()
    }
  }
});

/* multi photo uploader */
app.forms.Picture = app.forms.PictureBase.extend({
  templateName : "picture-form",

  initialize : function() {
    this.photos = this.model.photos || new Backbone.Collection()
    this.photos.bind("add", this.render, this)
  },

  postRenderTemplate : function(){
    this.$("input[name=authenticity_token]").val($("meta[name=csrf-token]").attr("content"))
    if(this.photos.length == 0 && app.remotePhotoUrl){
      this.$("form input[name='photo[image_url]']").val(app.remotePhotoUrl)
      _.defer(_.bind(this.submitURL, this));
    }
  },

  onSubmit : function (){
    this.$(".new_photo").append($('<span class="loader" style="margin-left: 5px;"></span>'))
  },

  uploadSuccess : function(resp) {
    this.photos.add(new Backbone.Model(resp.data))
    this.trigger("uploaded")
  }
});

/* wallpaper uploader */
app.forms.Wallpaper = app.forms.PictureBase.extend({
  templateName : "wallpaper-form",

  uploadSuccess : function(resp) {
    $("#profile").css("background-image", "url(" + resp.data.wallpaper + ")")
  }
});