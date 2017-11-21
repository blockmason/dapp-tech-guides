var ApprovedCreditor = artifacts.require("ApprovedCreditor");

contract('ApprovedCreditor', function(accounts) {
    it("should assert true", function(done) {
        var approvedCreditor = ApprovedCreditor.deployed();
        assert.isTrue(true);
        done(); // stops tests at this point
    });
});

contract('ApprovedCreditor', function(accounts) {
    it("Should initialize correctly", function(done) {
      var approvedCreditor = ApprovedCreditor.deployed();

      ApprovedCreditor.new({ from: accounts[0] }).then(
        function(approvedCreditor) {
         approvedCreditor.numAdmins.call().then(
          function(numAdmins) {
            assert.equal(numAdmins, 1, "Number of admins is wrong");
          }).then(function() {
            return approvedCreditor.numCreditors.call();
          }).then( function(numCreditors) {
            assert.equal(numCreditors, 1, "Number of creditors is wrong");
            return approvedCreditor.admins.call(accounts[0]);
          }).then( function(accountIsAdmin) {
            assert.equal(accountIsAdmin, true, "That address is not an admin");
            return approvedCreditor.approvedCreditors.call(accounts[0]);
          }).then( function(accountIsCreditor) {
            assert.equal(accountIsCreditor, true, "That address is not an approved creditor");
            done(); // to stop these tests earlier, move this up
          }).catch(done);
      }).catch(done);
    });

    it("Should allow an admin to create admins and approved creditors", function(done) {
        var approvedCreditor = ApprovedCreditor.deployed();
  
        ApprovedCreditor.new({ from: accounts[0] }).then(
          function(approvedCreditor) {
           approvedCreditor.addAdmin(accounts[1]).then(
            function() {
              return approvedCreditor.numAdmins.call();
            }).then(function(numAdmins) {
                assert.equal(numAdmins, 2, "Number of admins is wrong");
                return approvedCreditor.addCreditor(accounts[1]);
            }).then(function() {
                return approvedCreditor.numCreditors.call();
            }).then( function(numCreditors) {
                assert.equal(numCreditors, 2, "Number of creditors is wrong");
                return approvedCreditor.admins.call(accounts[1]);
            }).then( function(accountIsAdmin) {
                assert.equal(accountIsAdmin, true, "That address is not an admin");
                return approvedCreditor.approvedCreditors.call(accounts[1]);
            }).then( function(accountIsCreditor) {
                assert.equal(accountIsCreditor, true, "That address is not an approved creditor");
                done(); // to stop these tests earlier, move this up
            }).catch(done);
        }).catch(done);
    });
});




