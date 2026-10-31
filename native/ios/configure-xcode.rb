# frozen_string_literal: true
# Run AFTER prepare-shell.mjs on a generated Capacitor iOS project.
require 'xcodeproj'

project = Xcodeproj::Project.open('ios/App/App.xcodeproj')
target = project.targets.find { |t| t.name == 'App' }
abort 'Capacitor App target missing' unless target
group = project.main_group.find_subpath('TrackFitNative', true)
group.set_source_tree('<group>')
%w[TrackFitHealthKitPlugin.swift TrackFitViewController.swift].each do |name|
  rel = "App/#{name}"
  file = group.files.find { |f| f.path == rel } || group.new_file(rel)
  unless target.source_build_phase.files_references.include?(file)
    target.source_build_phase.add_file_reference(file)
  end
end
target.build_configurations.each do |config|
  config.build_settings['CODE_SIGN_ENTITLEMENTS'] = 'App/TrackFit.entitlements'
end
attributes = project.root_object.attributes['TargetAttributes'] ||= {}
target_attrs = attributes[target.uuid] ||= {}
capabilities = target_attrs['SystemCapabilities'] ||= {}
capabilities['com.apple.HealthKit'] = { 'enabled' => 1 }
project.save
puts 'TrackFit HealthKit Swift files added to the App target; entitlement configured.'
