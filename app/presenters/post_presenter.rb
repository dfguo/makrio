require File.join(File.dirname(__FILE__), '..', '..', 'lib', 'template_picker')

class PostPresenter
  include ActionView::Helpers::TextHelper
  attr_accessor :post, :current_user

  def initialize(post, current_user = nil)
    @post = post
    @current_user = current_user
  end

  def self.collection_json(collection, current_user)
    collection.map {|post| PostPresenter.new(post, current_user)}
  end

  def as_json(options={})
    {
        :id => @post.id,
        :guid => @post.guid,
        :text => @post.raw_message,
        :plain_text => @post.plain_text,
        :public => @post.public,
        :featured => @post.featured,
        :created_at => @post.created_at,
        :interacted_at => @post.interacted_at,
        :provider_display_name => @post.provider_display_name,
        :post_type => @post.post_type,
        :image_url => @post.image_url,
        :object_url => @post.object_url,
        :favorite => @post.favorite,
        :nsfw => @post.nsfw,
        :author => @post.author.as_api_response(:backbone),
        :o_embed_cache => @post.o_embed_cache.try(:as_api_response, :backbone),
        :mentioned_people => @post.mentioned_people.as_api_response(:backbone),
        :photos => @post.photos.map {|p| p.as_api_response(:backbone)},
        :frame_name => @post.frame_name || template_name,
        :parent => (options.fetch(:include_root, true) ? parent : nil),
        # :absolute_root => absolute_root,
        :title => title,
        :next_post => next_post_path,
        :previous_post => previous_post_path,
        :screenshot_url => @post.screenshot_url,
        :show_screenshot => self.show_screenshot?,

        :interactions => {
            :likes => [user_like].compact,
            :reshares => [user_reshare].compact,
            :comments_count => @post.comments_count,
            :likes_count => @post.likes_count,
            :reshares_count => @post.reshares_count,
            :remix_count => @post.remix_siblings.count
        }
    }
  end

  def next_post_path
    Rails.application.routes.url_helpers.next_post_path(@post)
  end

  def previous_post_path
    Rails.application.routes.url_helpers.previous_post_path(@post)
  end

  def title
    @post.text.present? ? truncate(@post.plain_text, :length => 118) : I18n.translate('posts.presenter.title', :name => @post.author.name)
  end

  def template_name #kill me, lol, I should be client side
    @template_name ||= TemplatePicker.new(@post).template_name
  end

  def parent
    PostPresenter.new(@post.parent, current_user).as_json(:include_root => false) if @post.respond_to?(:parent) && @post.parent.present?
  end

  def user_like
    @post.like_for(@current_user).try(:as_api_response, :backbone)
  end

  def user_reshare
    @post.reshare_for(@current_user)
  end

  def show_screenshot?
    @post.screenshot_url.present? && !has_gif?
  end


  protected

  def person
    @current_user.person
  end

  def user_signed_in?
    @current_user.present?
  end

  def has_gif?
    return false unless @post.photos.present?
    @post.photos.detect{ |p| p.url && p.url.match(".gif") }.present?
  end
end

class PostInteractionPresenter
  def initialize(post, current_user)
    @post = post
    @current_user = current_user
  end

  def as_json(options={})
    {
        :likes => as_api(@post.likes),
        :reshares => PostPresenter.collection_json(@post.reshares, @current_user),
        :comments => CommentPresenter.as_collection(@post.comments.order("created_at ASC")),
        :participations => as_api(@post.participations),
        # :remixes => RemixPresenter.as_collection(@post.remixes)
    }
  end

  def as_api(collection)
    collection.includes(:author => :profile).all.map do |element|
      element.as_api_response(:backbone)
    end
  end
end
