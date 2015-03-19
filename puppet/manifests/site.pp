


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

  class { 'wildfly::install':
    require => Class['java'],
    version        => '8.2.0',
    install_source => 'http://download.jboss.org/wildfly/8.2.0.Final/wildfly-8.2.0.Final.tar.gz',
    install_file   => 'wildfly-8.2.0.Final.tar.gz',
    java_home      => '/usr/lib/jvm/java-7-openjdk-amd64',
  }

}





node 'modeshape.dev' {

  include modeshapejava
  include modeshapewildfly
  include git

}
