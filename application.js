if (Meteor.isClient) {
  Results = new Mongo.Collection("results");
  HeroClasses = new Mongo.Collection("heroClasses");
  needRender = new ReactiveVar();

  Template.hstracker.created = function() {
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

    getResultsCount = function(myClass, oppClass, result) {
      return Results.find({myClass: myClass, oppClass: oppClass, result: result}).count();
    }

    HeroClasses.find().forEach(function(myClass) {
      HeroClasses.find().forEach(function(oppClass) {
        Session.set(myClass.heroClass + oppClass.heroClass + 'Wins', getResultsCount(myClass.heroClass, oppClass.heroClass, 'Win'));
        Session.set(myClass.heroClass + oppClass.heroClass + 'Losses', getResultsCount(myClass.heroClass, oppClass.heroClass, 'Loss'));
      })
    })
  }

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

  Template.className.rendered = function() {
    $('.ui.selection.dropdown')
    .dropdown('restore default text')
    ;
  };

  Template.winLossButtons.events({
    'click .win-button': function() {
      Results.insert({ myClass: $('#myClass').val(), oppClass: $('#oppClass').val(), result: "Win", createdAt: formatDate(new Date()) })
      Session.set($('#myClass').val() + $('#oppClass').val() + 'Wins', Session.get($('#myClass').val() + $('#oppClass').val() + 'Wins') + 1);
      needRender.set();
    },
    'click .loss-button': function() {
      Results.insert({ myClass: $('#myClass').val(), oppClass: $('#oppClass').val(), result: "Loss", createdAt: formatDate(new Date()) })
      Session.set($('#myClass').val() + $('#oppClass').val() + 'Losses', Session.get($('#myClass').val() + $('#oppClass').val() + 'Losses') + 1)
      needRender.set();
    }
  });

  Template.winCount.helpers({
    winCount: function() {
      return Session.get(Session.get('myClass') + Session.get('oppClass') + 'Wins')
    }
  })

  Template.lossCount.helpers({
    lossCount: function() {
      return Session.get(Session.get('myClass') + Session.get('oppClass') + 'Losses')
    }
  })

  Template.winPercentage.helpers({
    winPercentage: function() {
      var matchUp = Session.get('myClass') + Session.get('oppClass');
      var winCount = Session.get(matchUp + 'Wins');
      var lossCount = Session.get(matchUp + 'Losses');
      var calcPercentage = (winCount/(winCount + lossCount)*100).toFixed(2);
      if (calcPercentage > 0) {
        Session.set(matchUp + 'winPercentage', calcPercentage);
      } else {
        var percentage = 0;
        Session.set(matchUp + 'winPercentage', percentage.toFixed(2));
      }
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

  Template.statsTable.helpers({
    classNames: function() {
      return HeroClasses.find();
    }
  });

  Template.statsTable.events({
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

  Template.matchUpStats.rendered = function() {
    var that = this;
    this.autorun(function() {
      needRender.get();
      needRender.set('');
      Tracker.afterFlush(function() {
        var $target = that.$('td');
        $target.popup({
          content: "Wins: " + $target.attr('data-wins') + " Losses: " + $target.attr('data-losses'),
          hoverable: true,
          delay: {
            show: 300,
            hide: 300
          }
        });
      })
    })
  };

  Template.matchUpStats.helpers({
    getWins: function(myClass, oppClass) {
      return getResultsCount(myClass, oppClass, 'Win');
    },
    getLosses: function(myClass, oppClass) {
      return getResultsCount(myClass, oppClass, 'Loss');
    },
    winPercentage: function(myClass, oppClass) {
      var winCount = getResultsCount(myClass, oppClass, 'Win');
      var lossCount = getResultsCount(myClass, oppClass, 'Loss');
      var percentage = (winCount/(winCount + lossCount)*100).toFixed(2);
      if (percentage > 0) {
        return percentage;
      } else {
        percentage = 0;
        return percentage.toFixed(2);
      }
    },
    getStatus: function(myClass, oppClass) {
      var winCount = getResultsCount(myClass, oppClass, 'Win');
      var lossCount = getResultsCount(myClass, oppClass, 'Loss');
      var percentage = (winCount/(winCount + lossCount)*100).toFixed(2)
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
    results: function() {
      return Results.find({myClass: Session.get('myClass'), oppClass: Session.get('oppClass')});
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
  });
}

