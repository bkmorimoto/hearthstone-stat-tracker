if (Meteor.isClient) {
  Results = new Mongo.Collection("results");
  HeroClasses = new Mongo.Collection("heroClasses");
  needRender = new ReactiveVar();

  Meteor.subscribe("results");

  Template.hstracker.onCreated(function() {
    getResultsCount = function(myClass, oppClass, result) {
      return Results.find({myClass: myClass, oppClass: oppClass, result: result, owner: Meteor.userId()}).count();
    },
    calcWinPercentage = function(matchUp) {
      var winCount = Session.get(matchUp + 'Wins');
      var lossCount = Session.get(matchUp + 'Losses');
      return (winCount/(winCount + lossCount)*100);
    }
  })

  Template.featureList.helpers({
    features: function() {
      return [
        {desc: "Complete breakdown of your match up win percentages, so you can keep track of which match ups are more favorable for you."}
      ]
    }
  });

  Template.classDropdown.helpers({
    classNames: function() {
      return HeroClasses.find();
    }
  });

  Template.classDropdown.events({
    'change #myClass': function() {
      Session.set('myClass', $('#myClass').val());
    },
    'change #oppClass': function() {
      Session.set('oppClass', $('#oppClass').val());
    }
  })

  Template.className.onRendered(function() {
    $('.ui.selection.dropdown')
    .dropdown('restore default text')
    ;
  });

  Template.winLossButtons.onCreated(function() {
    formatDate = function(date) {
      var hours = date.getHours();
      var minutes = date.getMinutes();
      var ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12;
      hours = hours ? hours : 12;
      minutes = minutes < 10 ? '0'+minutes : minutes;
      var strTime = hours + ':' + minutes + ' ' + ampm;
      return date.getMonth()+1 + "/" + date.getDate() + "/" + date.getFullYear() + "  " + strTime;
    }
  })

  Template.winLossButtons.events({
    'click .win-button': function() {
      Results.insert({
        myClass: $('#myClass').val(),
        oppClass: $('#oppClass').val(),
        result: "Win",
        createdAt: formatDate(new Date()),
        owner: Meteor.userId(),
        username: Meteor.user().username
      })
      needRender.set();
    },
    'click .loss-button': function() {
      Results.insert({
        myClass: $('#myClass').val(),
        oppClass: $('#oppClass').val(),
        result: "Loss",
        createdAt: formatDate(new Date()),
        owner: Meteor.userId(),
        username: Meteor.user().username
      })
      needRender.set();
    }
  });

  Template.winCount.helpers({
    winCount: function() {
      Session.set(Session.get('myClass') + Session.get('oppClass') + 'Wins', getResultsCount(Session.get('myClass'), Session.get('oppClass'), "Win"));
      return Session.get(Session.get('myClass') + Session.get('oppClass') + 'Wins')
    }
  })

  Template.lossCount.helpers({
    lossCount: function() {
      Session.set(Session.get('myClass') + Session.get('oppClass') + 'Losses', getResultsCount(Session.get('myClass'), Session.get('oppClass'), "Loss"));
      return Session.get(Session.get('myClass') + Session.get('oppClass') + 'Losses')
    }
  })

  Template.winPercentage.helpers({
    winPercentage: function() {
      var matchUp = Session.get('myClass') + Session.get('oppClass');
      var calcPercentage = calcWinPercentage(matchUp);
      if (isNaN(calcPercentage)) {calcPercentage = 0}
      Session.set(matchUp + 'winPercentage', calcPercentage.toFixed(2));
      return Session.get(matchUp + 'winPercentage');
    },
    getStatusColor: function() {
      var matchUp = Session.get('myClass') + Session.get('oppClass');
      var winPercentage = Session.get(matchUp + 'winPercentage');
      if (winPercentage >= 60) {
        return 'green'
      } else if (winPercentage >= 50) {
        return 'yellow'
      } else if (winPercentage > 0) {
        return 'red'
      } else {
        return ''
      }
    }
  })

  Template.statsTable.onCreated(function() {
    this.subscribe('heroClasses');
  })

  Template.matchUpListings.onRendered(function() {
    HeroClasses.find().forEach(function(myClass) {
      HeroClasses.find().forEach(function(oppClass) {
        var matchUp = myClass.heroClass + oppClass.heroClass;
        Session.set(matchUp + 'Wins', getResultsCount(myClass.heroClass, oppClass.heroClass, 'Win'));
        Session.set(matchUp + 'Losses', getResultsCount(myClass.heroClass, oppClass.heroClass, 'Loss'));
        var calcPercentage = calcWinPercentage(matchUp);
        if (isNaN(calcPercentage)) {calcPercentage = 0}
        Session.set(matchUp + 'winPercentage', calcPercentage.toFixed(2));
      })
    })
  })

  Template.matchUpListings.helpers({
    classNames: function() {
      return HeroClasses.find();
    }
  });

  Template.matchUpListings.events({
    'click td': function(event, template) {
      var $target = $(event.target);
      var myClass = $target.data('myClass');
      var oppClass = $target.data('oppClass');
      Session.set('myClass', myClass);
      Session.set('oppClass', oppClass);
      $('.dropdown.myClass').first().dropdown('set selected', myClass);
      $('.dropdown.oppClass').first().dropdown('set selected', oppClass);
    }
  })

  Template.matchUpStats.onRendered(function() {
    var that = this;
    this.autorun(function() {
      needRender.get();
      needRender.set('');
      Tracker.afterFlush(function() {
        var $target = that.$('td');
        var matchUp = $target.data('myClass') + $target.data('oppClass');
        $target.popup({
          content: "Wins: " + Session.get(matchUp + 'Wins') + " Losses: " + Session.get(matchUp + 'Losses'),
          hoverable: true,
          delay: {
            show: 200,
            hide: 400
          }
        });
      })
    })
  });

  Template.matchUpStats.helpers({
    winPercentage: function(myClass, oppClass) {
      return Session.get(myClass + oppClass + 'winPercentage')
    },
    getStatus: function(myClass, oppClass) {
      var matchUp = myClass + oppClass;
      var percentage = calcWinPercentage(matchUp);
      if (percentage >= 60) {
        return 'positive';
      } else if (percentage >= 50) {
        return 'warning';
      } else if (percentage >= 0) {
        return 'negative';
      } else {
        return 'no-results';
      }
    }
  });

  Template.results.helpers({
    hasResults: function() {
      return Results.find({myClass: Session.get('myClass'), oppClass: Session.get('oppClass'), owner: Meteor.userId()}).count() > 0;
    },
    results: function() {
      return Results.find({myClass: Session.get('myClass'), oppClass: Session.get('oppClass'), owner: Meteor.userId()});
    }
  });

  Template.result.helpers({
    getStatus: function(result) {
      if (result == 'Win') {
        return 'positive';
      } else {
        return 'negative';
      }
    }
  });

  Template.result.events({
    'click button': function(event) {
      var $target = $(event.target);
      var entryId = $target.closest('button').data('id')
      Results.remove({'_id': entryId})
      needRender.set();
    }
  });

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    Results = new Mongo.Collection("results");
    HeroClasses = new Mongo.Collection("heroClasses");

    if (HeroClasses.find().count() == 0) {
      HeroClasses.insert({ heroClass: "Druid" });
      HeroClasses.insert({ heroClass: "Hunter" });
      HeroClasses.insert({ heroClass: "Mage" });
      HeroClasses.insert({ heroClass: "Paladin" });
      HeroClasses.insert({ heroClass: "Priest" });
      HeroClasses.insert({ heroClass: "Rogue" })
      HeroClasses.insert({ heroClass: "Shaman" });
      HeroClasses.insert({ heroClass: "Warlock" });
      HeroClasses.insert({ heroClass: "Warrior" });
    }

    Meteor.publish('heroClasses', function() {
      return HeroClasses.find();
    })
    Meteor.publish('results', function() {
      return Results.find();
    })
  });
}

