ScienceKit Client
=================

Created project using shared Cordova library location:

	./create --shared ~/Workspace/Checkouts/sciencekit-client/iOS org.apache.cordova.ScienceKitClient ScienceKitClient

From the location of the shared Cordova installation:

	 ./update_cordova_subproject path/to/your/project 

For information about setting up the enviornment is available on the [http://docs.phonegap.com/en/2.5.0/guide_getting-started_ios_index.md.html](Getting Started with iOS) page in the PhoneGap Documentation.

== Set up iPad for Development

=== Install Jade for Client-side Templating

This project uses Jade to render HTML files that will be used for the PhoneGap application.  This requires you to have the <code>npm</code> tool that ships with Node.js.  Therefore, you must also install Node.js.

Install Jade using the following command:

	npm install jade -g

Compile all <code>.jade</code> files to <code>.html</code> files using the command:

	make

=== Set up Apple Development Environment

Provisioning profile:

	edu.umd.hcil.sciencekit.*

Project package:

	edu.umd.hcil.sciencekit.ScienceKitClient