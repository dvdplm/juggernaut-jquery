require 'juggernaut'
require 'juggernaut_helper'

# ActionView::Helpers::AssetTagHelper::register_javascript_include_default('juggernaut')
# ActionView::Helpers::AssetTagHelper::register_javascript_include_default('swfobject')

ActionView::Base.send(:include, Juggernaut::JuggernautHelper)

ActionView::Helpers::AssetTagHelper.register_javascript_expansion :juggernaut => [
  'juggernaut/swfobject', 'juggernaut/jquery.juggernaut.js', 'juggernaut/jquery.json.js']

ActionController::Base.class_eval do
  alias_method :render_without_juggernaut, :render
  include Juggernaut::RenderExtension
  alias_method :render, :render_with_juggernaut
end

ActionView::Base.class_eval do
  alias_method :render_without_juggernaut, :render
  include Juggernaut::RenderExtension
  alias_method :render, :render_with_juggernaut
end
