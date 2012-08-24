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

      // Setup a future
      var fut = new Future();

      var urls = [
        'http://google.com',
        'http://news.ycombinator.com',
        'https://github.com'
      ];

      var urlResults = [];

      var onComplete = function(err, result) {
        urlResults.push(result);

        // Once we've recieved all the results return them
        if (urlResults.length >= urls.length)

          // Return the results
          fut.ret(urlResults);
      };

      // Keep track of each job in an array
      _.each(urls, function(url) {

        /// Make async http call
        Meteor.http.get(url, function(error, result) {

          // Get the title
          var title = getTitle(result);

          // Inform the future that we're done with,
          // it and send the title in place of the 
          // raw result
          onComplete(error, title);
        });

      });

      // Wait for async to finish before returning
      // the result
      return fut.wait();
    }
  });

}
