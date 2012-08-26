if (Meteor.is_client) {
  Template.hello.greeting = function () {
    return "Welcome to fiber-test.";
  };

  Template.hello.events = {
    'click input' : function () {
      var message = "You pressed the button and we ran an async job in a fiber just for fun!";

      Meteor.call('parallelAsyncJob', message, function(err, titles) {
        if (typeof console !== 'undefined') {
          console.log('Fetched ' + titles.length + ' titles: ');
          _.each(titles, function(title) {
            console.log('    ' + title);
          });
        }
      });
    }
  };
}

if (Meteor.is_server) {

  var getTitle = function(result) {
    // So dirty
    var parts = result.content.split('<title>');
    return parts[1].split('</title>')[0];
  };

  Meteor.methods({
    parallelAsyncJob: function(message) {
      var urls = [
        'http://google.com',
        'http://news.ycombinator.com',
        'https://github.com'
      ];

      var futures = _.map(urls, function(url) {
        var future = new Future();
        var onComplete = future.resolver();
        
        /// Make async http call
        Meteor.http.get(url, function(error, result) {

          // Get the title, if there was no error
          var title = (!error) && getTitle(result);
          
          onComplete(error, title);
        });
        
        return future;
      });
      
      // wait for all futures to finish
      Future.wait(futures);
      
      // and grab the results out.
      return _.invoke(futures, 'get'); 
    }
  });

}
