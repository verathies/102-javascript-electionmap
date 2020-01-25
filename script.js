var createPolitician = function (name){
  var politician= {};
  politician.name = name;
  politician.electionResults= null;
  politician.totalVotes = 0; 
  politician.tallyUpTotalVotes= function (){ 
    this.totalVotes=0; 
    for (var i=0; i<this.electionResults.length; i++){
      this.totalVotes=this.totalVotes+this.electionResults[i]; 
    }
  };
   return politician;
};
var candidate1=createPolitician("Trump"); 
var candidate2=createPolitician("Obama");

candidate1.electionResults=[5,1,7,2,33,6,4,2,1,14,8,3,1,11,11,0,5,3,3,3,7,4,8,9,3,7,2,2,4,2,8,3,15,15,2,12,0,4,13,1,3,2,8,21,3,2,11,1,3,7,2];

candidate2.electionResults=[4,2,4,4,22,3,3,1,2,15,8,1,3,9,0,6,1,5,5,1,3,7,8,1,3,3,1,3,2,2,6,2,14,0,1,6,7,3,7,3,6,1,3,17,3,1,2,11,2,3,1];

// update of election results in array 
candidate1.electionResults[9]=1; 
candidate2.electionResults[9]=28; 

candidate1.electionResults[4]=17; 
candidate2.electionResults[4]=38; 

candidate1.electionResults[43]=11; 
candidate2.electionResults[43]=27; 

// connect candidate with total Votes

candidate1.tallyUpTotalVotes(); 
candidate2.tallyUpTotalVotes();
 

console.log(candidate1);
console.log(candidate2);

console.log(candidate1.totalVotes);
console.log(candidate2.totalVotes);


/* create var winner. Use if / else statements to determine which of your politician has the most votes, and whether the overall election is a draw.then console.log*/ 

var winner; 

if (candidate1.totalVotes===candidate2.totalVotes){
  winner="Draw!";
} else if (candidate1.totalVotes > candidate2.totalVotes){
  winner=candidate1.name;
} else {
  winner=candidate2.name; 
};

console.log("And the winner is: "+winner+"!!!");


