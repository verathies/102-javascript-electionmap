// factory function createPolitician with object politician 
var createPolitician = function (name, partyColor){
  var politician= {};
  politician.name = name;
  politician.electionResults= null;
  politician.totalVotes = 0; 
  politician.partyColor= partyColor;
  politician.tallyUpTotalVotes= function (){ 
    this.totalVotes=0; 
    for (var i=0; i<this.electionResults.length; i++){
      this.totalVotes=this.totalVotes+this.electionResults[i]; 
    }
  };
   return politician;
};

// create two candidates with their party color
var candidate1=createPolitician("Trump", [132, 17, 11]); 
var candidate2=createPolitician("Clinton", [245, 141, 136]);

// array for election results for each candidate
candidate1.electionResults=[5,1,7,2,33,6,4,2,1,14,8,3,1,11,11,0,5,3,3,3,7,4,8,9,3,7,2,2,4,2,8,3,15,15,2,12,0,4,13,1,3,2,8,21,3,2,11,1,3,7,2];

candidate2.electionResults=[4,2,4,4,22,3,3,1,2,15,8,1,3,9,0,6,1,5,5,1,3,7,8,1,3,3,1,3,2,2,6,2,14,0,1,6,7,3,7,3,6,1,3,17,3,1,2,11,2,3,1];

// update of election results in array 
candidate1.electionResults[9]=1; 
candidate2.electionResults[9]=28; 

candidate1.electionResults[4]=17; 
candidate2.electionResults[4]=38; 

candidate1.electionResults[43]=11; 
candidate2.electionResults[43]=27; 

// setStateResults  function for setting the state results with state as parameter

var setStateResults = function (state){
    theStates[state].winner = null;
    if (candidate1.electionResults[state] > candidate2.electionResults[state]){
      theStates[state].winner = candidate1;
    } else if (candidate2.electionResults[state]> candidate1.electionResults[state]){
      theStates[state].winner = candidate2;
    }
  //var stateWinner to connect state with color of the state winner
  var stateWinner = theStates[state].winner;
    if (stateWinner !== null){
      theStates[state].rgbColor= stateWinner.partyColor; 
    } else {
      theStates[state].rgbColor= [11, 32, 57];
  }
   // populate interactive table stateResults 
   var stateInfoTable= document.getElementById('stateResults');
  
   var header= stateInfoTable.children[0].children[0];
     var stateName= header.children[0];
     stateName.innerText=theStates[state].nameFull;
   
     var abbreviation=header.children[1];
     abbreviation.innerText=theStates[state].nameAbbrev;
   
   var body= stateInfoTable.children[1];
     var candidate1Name= body.children[0].children[0];
     candidate1Name.innerText=candidate1.name;
     
     var candidate1Results=body.children[0].children[1];
     candidate1Results.innerText= theStates[state].candidate1.electionResults
       
     var candidate2Name= body.children[1].children[0];
     candidate2Name.innerText= candidate2.name;
   
     var candidate2Results= body.children[1].children[1];
     candidate2Results.innerText=theStates[state].candidate2.electionResults
       
     var winnersName=body.children[2].children[1];
     //if else statement for winner
     if (theStates[state].winner === null){
      winnersName.innerText= "DRAW";
     } else {
      winnersName.innerText= theStates[state].winner.name;
     }

};
    
// connect candidate with total Votes

candidate1.tallyUpTotalVotes(); 
candidate2.tallyUpTotalVotes();
 

console.log(candidate1);
console.log(candidate2);

console.log(candidate1.totalVotes);
console.log(candidate2.totalVotes);


//var winner determines which of your politician has the most votes, and whether the overall election is a draw. 

var winner; 

if (candidate1.totalVotes===candidate2.totalVotes){
  winner="Draw!";
} else if (candidate1.totalVotes > candidate2.totalVotes){
  winner=candidate1.name;
} else {
  winner=candidate2.name; 
};

console.log("And the winner is: "+winner+"!!!");

// created partyColor parameter, connected it to each candidate

console.log("Trump's color is: "+candidate1.partyColor);
console.log("Clinton's color is: "+candidate2.partyColor);

// populate static table countryResults to announce the winners

var countryInfoTable = document.getElementById('countryResults');

  countryInfoTable.children[0].children[0].children[0].innerText=candidate1.name;
  countryInfoTable.children[0].children[0].children[1].innerText= candidate1.totalVotes;
  countryInfoTable.children[0].children[0].children[2].innerText=candidate2.name;
  countryInfoTable.children[0].children[0].children[3].innerText= candidate2.totalVotes;
  countryInfoTable.children[0].children[0].children[5].innerText= winner;
    
