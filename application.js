WinChart = new Mongo.Collection("winChart");

if (Meteor.isClient) {

  HeroClasses = new Mongo.Collection("heroClasses");

  function formatDate(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    return date.getMonth()+1 + "/" + date.getDate() + "/" + date.getFullYear() + "  " + strTime;
  }

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
      var calcPercentage = (Session.get('winCount')/(Session.get('winCount') + Session.get('lossCount'))*100).toFixed(2)
      if (calcPercentage > 0) {
        Session.set('winPercentage', calcPercentage);
      } else {
        var percentage = 0;
        Session.set('winPercentage', percentage.toFixed(2));
      }
      return Session.get('winPercentage');
    },
    getStatusColor: function() {
      var winP = Session.get('winPercentage')
      if (winP >= 60) {
        return 'green'
      } else if (winP >= 55) {
        return '#e4e821'
      } else if (winP >= 50) {
        return 'orange'
      } else if (winP > 0) {
        return 'red'
      } else {
        return 'grey'
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
      WinChart.insert({ myClass: $('input')[0].value, oppClass: $('input')[1].value, result: "win", createdAt: formatDate(new Date()) })
    }
  });

  Template.loss.events({
    'click button': function () {
      WinChart.insert({ myClass: $('input')[0].value, oppClass: $('input')[1].value, result: "loss", createdAt: formatDate(new Date()) })
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

  Template.statsTable.helpers({
    myClassNames: function() {
      return HeroClasses.find();
    },
    oppClassNames: function() {
      return HeroClasses.find();
    },
    winPercentage: function(myClass, oppClass) {
      var winCount = WinChart.find({myClass: myClass.toLowerCase(), oppClass: oppClass.toLowerCase(), result: "win"}).count();
      var lossCount = WinChart.find({myClass: myClass.toLowerCase(), oppClass: oppClass.toLowerCase(), result: "loss"}).count();
      var percentage = (winCount/(winCount + lossCount)*100).toFixed(2)
      if (percentage > 0) {
        return percentage;
      } else {
        percentage = 0;
        return percentage.toFixed(2);
      }
    },
    getBackgroundColor: function(myClass, oppClass) {
      var winCount = WinChart.find({myClass: myClass.toLowerCase(), oppClass: oppClass.toLowerCase(), result: "win"}).count();
      var lossCount = WinChart.find({myClass: myClass.toLowerCase(), oppClass: oppClass.toLowerCase(), result: "loss"}).count();
      var percentage = (winCount/(winCount + lossCount)*100).toFixed(2)
      if (percentage >= 60) {
        return 'green'
      } else if (percentage >= 55) {
        return '#e4e821'
      } else if (percentage >= 50) {
        return 'orange'
      } else if (percentage >= 0.00) {
        return 'red'
      } else {
        return 'grey'
      }
    }
  });

}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // WinChart.remove({});
   
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

