#   Copyright (c) 2010-2011, Diaspora Inc.  This file is
#   licensed under the Affero General Public License version 3 or later.  See
#   the COPYRIGHT file.

require 'spec_helper'

describe LikesController do
  before do
    sign_in :user, alice
  end

  [Comment, Post].each do |class_const|
    context class_const.to_s do
        let(:id_field){
          "#{class_const.to_s.underscore}_id"
        }

      describe '#create' do
        let(:like_hash) {
          {:positive => 1,
           id_field => "#{@target.id}"}
        }
        let(:dislike_hash) {
          {:positive => 0,
           id_field => "#{@target.id}"}
        }

        context "on my own post" do
          it 'succeeds' do
            @target = alice.post :status_message, :text => "AWESOME"
            @target = alice.comment!(@target, "hey") if class_const == Comment
            post :create, like_hash.merge(:format => :json)
            response.code.should == '201'
          end
        end

        context "on a post from another user" do
          before do
            @target = bob.post(:status_message, :text => "AWESOME")
            @target = bob.comment!(@target, "hey") if class_const == Comment
          end

          it 'likes' do
            post :create, like_hash
            response.code.should == '201'
          end

          it 'dislikes' do
            post :create, dislike_hash
            response.code.should == '201'
          end

          it "doesn't post multiple times" do
            alice.like!(@target)
            post :create, dislike_hash
            response.code.should == '422'
          end
        end
      end

      describe '#index' do
        before do
          @message = alice.post(:status_message, :text => "hey")
          @message = alice.comment!(@message, "hey") if class_const == Comment
        end

        it 'generates a jasmine fixture', :fixture => true do
          get :index, id_field => @message.id

          save_fixture(response.body, "ajax_likes_on_#{class_const.to_s.underscore}")
        end

        it 'returns an array of likes for a post' do
          like = bob.like!(@message)
          get :index, id_field => @message.id
          assigns[:likes].map(&:id).should == @message.likes.map(&:id)
        end

        it 'returns an empty array for a post with no likes' do
          get :index, id_field => @message.id
          assigns[:likes].should == []
        end
      end

      describe '#destroy' do
        before do
          @message = bob.post(:status_message, :text => "hey")
          @message = bob.comment!(@message, "hey") if class_const == Comment
          @like = alice.like!(@message)
        end

        it 'lets a user destroy their like' do
          expect {
            delete :destroy, :format => :json, id_field => @like.target_id, :id => @like.id
          }.should change(Like, :count).by(-1)
          response.status.should == 204
        end

        it 'does not let a user destroy other likes' do
          like2 = eve.like!(@message)

          like_count = Like.count
          expect {
            delete :destroy, :format => :json, id_field => like2.target_id, :id => like2.id
          }.should raise_error(ActiveRecord::RecordNotFound)

          Like.count.should == like_count
        end
      end
    end
  end
end
