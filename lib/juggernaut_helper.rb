module Juggernaut # :nodoc:
  module JuggernautHelper

    def juggernaut(options = {})
      hosts = Juggernaut::CONFIG[:hosts].select {|h| !h[:environment] or h[:environment] == ENV['RAILS_ENV'].to_sym }
      random_host = hosts[rand(hosts.length)]
      options = {
        :host                 => (random_host[:public_host] || random_host[:host]),
        :port                 => (random_host[:public_port] || random_host[:port]),
        :width                => '0px',
        :height               => '0px',
        :session_id           => session.session_id,
        :swf_address          => "/juggernaut/juggernaut.swf",
        :ei_swf_address       => "/juggernaut/expressinstall.swf",
        :flash_version        => 8,
        :flash_color          => "#fff",
        :swf_name             => "juggernaut_flash",
        :bridge_name          => "juggernaut",
        :debug                => (RAILS_ENV == 'development'),
        :reconnect_attempts   => 3,
        :reconnect_intervals  => 3
      }.merge(options)
      init_juggernaut(options)
    end
    
    def init_juggernaut(options)
      case Juggernaut::JSLIB
        when :prototype
          javascript_tag %Q{
            new Juggernaut(#{options.to_json})
          }
        when :jquery
          javascript_tag %Q{
            jQuery(document).ready(function(){
              jQuery.Juggernaut.initialize(#{options.to_json})
            });
          }
      end
    end
    
    def expand_javascript_sources(sources, recursive = false)
      if sources.include?(:juggernaut)
        juggernaut_js = case Juggernaut::JSLIB
                          when  :prototype then ['juggernaut/juggernaut.js']
                          when  :jquery then ['juggernaut/jquery.juggernaut.js', 'juggernaut/jquery.json.js']
                          else  ['juggernaut/juggernaut.js']
                        end
                          
        sources = sources[0..(sources.index(:juggernaut))] + 
          ['juggernaut/swfobject', *juggernaut_js ] + 
          sources[(sources.index(:juggernaut) + 1)..sources.length]
        sources.delete(:juggernaut)
      end
      if recursive
        super(sources, recursive) 
      else
        super(sources)
      end
    end
    
  end
end
