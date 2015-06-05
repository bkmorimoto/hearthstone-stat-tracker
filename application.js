if (Meteor.isClient) {
  WinChart = new Mongo.Collection("winChart");
  HeroClasses = new Mongo.Collection("heroClasses");

  function formatDate(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0'+minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    return date.getMonth()+1 + "/" + date.getDate() + "/" + date.getFullYear() + "  " + strTime;
  }

  Template.winCount.helpers({
    winCount: function() {
      Session.set('winCount', WinChart.find({myClass: Session.get('myClass'), oppClass: Session.get('oppClass'), result: "Win"}).count())
      return Session.get('winCount');
    }
  })

  Template.lossCount.helpers({
    lossCount: function() {
      Session.set('lossCount', WinChart.find({myClass: Session.get('myClass'), oppClass: Session.get('oppClass'), result: "Loss"}).count())
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
      } else if (winP >= 50) {
        return 'yellow'
      } else if (winP > 0) {
        return 'red'
      } else {
        return ''
      }
    }
  })

  Template.results.helpers({
    results: function() {
      return WinChart.find({myClass: Session.get('myClass'), oppClass: Session.get('oppClass')});
    }
  })

  Template.result.helpers({
    getStatus: function(result) {
      if (result == 'Win') {
        return 'positive';
      } else {
        return 'negative';
      }
    }
  })

  Template.result.events({
    'click button': function(event) {
      var $target = $(event.target);
      var entryId = $target.closest('button').data('id')
      WinChart.remove({'_id': entryId})
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
      WinChart.insert({ myClass: $('input')[0].value, oppClass: $('input')[1].value, result: "Win", createdAt: formatDate(new Date()) })
    }
  });

  Template.loss.events({
    'click button': function () {
      WinChart.insert({ myClass: $('input')[0].value, oppClass: $('input')[1].value, result: "Loss", createdAt: formatDate(new Date()) })
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
    }
  });

  Template.statsTable.events({
    'click td': function(event) {
      var $target = $(event.target);
      var myClass = $target.data('myClass');
      var oppClass = $target.data('oppClass');
      var $myClassInput = $('input').first();
      var $oppClassInput = $('input').last();
      $myClassInput.val(myClass);
      $oppClassInput.val(oppClass);
      Session.set('myClass', myClass);
      Session.set('oppClass', oppClass);
      $myClassInput.closest('.dropdown').children('.text').removeClass('default');
      $oppClassInput.closest('.dropdown').children('.text').removeClass('default');
      $myClassInput.closest('.dropdown').children('.text').html(myClass);
      $oppClassInput.closest('.dropdown').children('.text').html(oppClass);
      $myClassInput.closest('.dropdown').find('.item').removeClass('active selected')
      $oppClassInput.closest('.dropdown').find('.item').removeClass('active selected')
      $myClassInput.closest('.dropdown').find('.item[data-value="' + myClass +'"]').addClass('active selected');
      $oppClassInput.closest('.dropdown').find('.item[data-value="' + oppClass +'"]').addClass('active selected');
    }
  })

  Template.matchUpStats.helpers({
    getWins: function(myClass, oppClass) {
      return WinChart.find({myClass: myClass, oppClass: oppClass, result: "Win"}).count();
    },
    getLosses: function(myClass, oppClass) {
      return WinChart.find({myClass: myClass, oppClass: oppClass, result: "Loss"}).count();
    },
    winPercentage: function(myClass, oppClass) {
      var winCount = WinChart.find({myClass: myClass, oppClass: oppClass, result: "Win"}).count();
      var lossCount = WinChart.find({myClass: myClass, oppClass: oppClass, result: "Loss"}).count();
      var percentage = (winCount/(winCount + lossCount)*100).toFixed(2)
      if (percentage > 0) {
        return percentage;
      } else {
        percentage = 0;
        return percentage.toFixed(2);
      }
    },
    getStatus: function(myClass, oppClass) {
      var winCount = WinChart.find({myClass: myClass, oppClass: oppClass, result: "Win"}).count();
      var lossCount = WinChart.find({myClass: myClass, oppClass: oppClass, result: "Loss"}).count();
      var percentage = (winCount/(winCount + lossCount)*100).toFixed(2)
      if (percentage >= 60) {
        return 'positive'
      } else if (percentage >= 50) {
        return 'warning'
      } else if (percentage >= 0.00) {
        return 'negative'
      } else {
        return 'no-results'
      }
    }
  });

  Template.matchUpStats.rendered = function() {
    this.$('td').popup({
      hoverable: true,
      delay: {
        show: 300,
        hide: 300
      }
    });
  }

}

if (Meteor.isServer) {
  Meteor.startup(function () {
    WinChart = new Mongo.Collection("winChart");
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

