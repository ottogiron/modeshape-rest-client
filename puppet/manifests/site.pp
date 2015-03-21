
class modeshapenode {

  class { 'nodejs':
    version => 'v0.12.0',
  }

  package { 'nodemon':
    provider => 'npm',
    require => Class['nodejs']
  }


}

class modeshapejava {

  #installs openjdk
  class { 'java':
    distribution => 'jdk',
  }

  class { "maven::maven":
    require => Class['java'],
    version => "3.2.5", # version to install
    # you can get Maven tarball from a Maven repository instead than from Apache servers, optionally with a user/password
    repo => {
      #url => "http://repo.maven.apache.org/maven2",
      #username => "",
      #password => "",
    }
  }

}

class modeshapewildfly {

  include wget

  package { 'unzip':
    ensure => installed,
  }

  class { 'wildfly::install':
    require        => Class['modeshapejava'],
    version        => '8.2.0',
    install_source => 'http://download.jboss.org/wildfly/8.2.0.Final/wildfly-8.2.0.Final.tar.gz',
    install_file   => 'wildfly-8.2.0.Final.tar.gz',
    java_home      => '/usr/lib/jvm/java-7-openjdk-amd64',
    #config         => 'standalone-modeshape.xml'
  }

  wget::fetch { 'download_modeshape':
    source      => 'http://downloads.jboss.org/modeshape/4.2.0.Final/modeshape-4.2.0.Final-jboss-wf8-dist.zip',
    destination => '/tmp/modeshape-4.2.0.Final-jboss-wf8-dist.zip',
    timeout     => 0,
    verbose     => false,
    require     => Class['wildfly::install']
  } ->
  exec { 'unzip_modeshape':
    command => '/usr/bin/unzip /tmp/modeshape-4.2.0.Final-jboss-wf8-dist.zip -d /opt/wildfly',
    creates => '/opt/wildfly/standalone/configuration/standalone-modeshape.xml',
    require =>  Package['unzip']
  }





}





node 'modeshape.dev' {

  include modeshapejava
  include modeshapewildfly
  include modeshapenode
  include git

}
