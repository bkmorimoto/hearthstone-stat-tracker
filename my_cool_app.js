WinChart = new Mongo.Collection("winChart");

if (Meteor.isClient) {

  Template.winCount.helpers({
    winCount: function() {
      Session.set('winCount', WinChart.find({myClass: Session.get('myClass'), oppClass: Session.get('oppClass'), result: "win"}).count())
      return Session.get('winCount');
    }
  })

  Template.lossCount.helpers({
    lossCount: function() {
      Session.set('lossCount', WinChart.find({myClass: Session.get('myClass'), oppClass: Session.get('oppClass'), result: "loss"}).count())
      return Session.get('lossCount');
    }
  })

  Template.winPercentage.helpers({
    winPercentage: function() {
      Session.set('winPercentage', (Session.get('winCount')/(Session.get('winCount') + Session.get('lossCount'))*100).toFixed(2))
      return Session.get('winPercentage');
    },
    getStatusColor: function() {
      var winP = Session.get('winPercentage')
      if (winP >= 80) {
        return 'green'
      }
      else if (winP >= 60) {
        return '#e4e821'
      }
      else if (winP >= 40) {
        return 'orange'
      }
      else {
        return 'red'
      }
    }
  })

  Template.results.helpers({
    results: function() {
      return WinChart.find({myClass: Session.get('myClass'), oppClass: Session.get('oppClass')});
    }
  })

  Template.classNames.events({
    'change input': function() {
      Session.set('myClass', $('input')[0].value);
      Session.set('oppClass', $('input')[1].value);
    }
  })

  Template.win.events({
    'click button': function () {
      WinChart.insert({ myClass: $('input')[0].value, oppClass: $('input')[1].value, result: "win", createdAt: new Date() })
    }
  });

  Template.loss.events({
    'click button': function () {
      WinChart.insert({ myClass: $('input')[0].value, oppClass: $('input')[1].value, result: "loss", createdAt: new Date() })
    }
  });

  Template.className.rendered = function() {
    $('.ui.selection.dropdown')
    .dropdown('restore default text')
    ;
  };

  Template.classNames.helpers({
    classNames: function() {
      return HeroClasses.find();
    }
  });

}

if (Meteor.isServer) {
  Meteor.startup(function () {
    WinChart.remove({});
  });
}

