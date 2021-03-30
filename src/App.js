import React, { useState, useEffect } from "react";
import { faExternalLinkAlt, faTrashAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import NumberFormat from 'react-number-format';
import $ from 'jquery';

import './App.css';

function App() {
	/* DOM elements */
	const monthsDiv = document.getElementById("months-container");
	const yearsDiv = document.getElementById("years-container");
	const sessionDiv = document.getElementById("sessionLabel");
	const sessionInput = document.getElementById("session-input");

	const appName = "haggleApp";
	const initVals = {
		price: 10000,
		rate: 2.5,
		months: 60,
		years: 5
	}
	let showMonths = false;

	/* State variables */
	const [price, setPrice] = useState(initVals.price);
	const [rate, setRate] = useState(initVals.rate);
	const [timeMonths, setTimeMonths] = useState(initVals.months);
	const [timeYears, setTimeYears] = useState(initVals.years);
	const [sessionName, setSessionName] = useState(appName);
	const [monthlyPayment, setMonthlyPayment] = useState();
	const [totalInterest, setTotalInterest] = useState();
	const [totalPayment, setTotalPayment] = useState();

	const priceObj = {
		fieldName: "price-input",
		changeBy: 1000,
		maxAmount: 1000000,
		updateState: setPrice
	}

	const rateObj = {
		fieldName: "rate-input",
		changeBy: 0.25,
		maxAmount: 30,
		updateState : setRate
	}

	const monthsObj = {
		fieldName: "months-input",
		changeBy: 6,
		maxAmount: 1000,
		updateState: setTimeMonths
	}

	const yearsObj = {
		fieldName: "years-input",
		changeBy: 1,
		maxAmount: 40,
		updateState: setTimeYears
	}

	// calculate when price/rate/months change
	useEffect(() => { 
		if (parseInt(price) && parseFloat(rate) && parseInt(timeMonths)) {

			const results = calculateMonthly({
				amount : parseInt(price), 
				interest: parseFloat(rate), 
				months: parseInt(timeMonths)
			});

			saveLocalStorage();
			
			setMonthlyPayment(results.monthlyPayment);
			setTotalInterest(results.totalInterest);
			setTotalPayment(results.totalPayment);
		}
	}, [price, rate, timeMonths]);

	// update window title when session is named
	useEffect(() => { 
		document.title = sessionName; 
	}, [sessionName]);

	// initialize session variables if query params exist
	useEffect(() => {
		const queryUrl = window.location.search.match(/[^?]/g);
		if (queryUrl) {
			queryUrl.join("").split("&").forEach(pair => {
				const kv = pair.split("=");
				initVals[kv[0]] = kv[1];
			});

			if (initVals.hasOwnProperty("price") && parseInt(initVals["price"])) {
				checkValues({ value: parseInt(initVals["price"]) }, priceObj);
			}
			if (initVals.hasOwnProperty("rate") && parseFloat(initVals["rate"])) {
				checkValues({ value: parseFloat(initVals["rate"]) }, rateObj);				
			}
			if (initVals.hasOwnProperty("months") && parseInt(initVals["months"])) {
				checkValues({ value: parseInt(initVals["months"]) }, monthsObj);
			}
			if (initVals.hasOwnProperty("sessionName")) {
				setSessionName(decodeURI(initVals["sessionName"]));
			}

			initSessionList();
		}
	}, []);

	const initSessionList = () => {
		const dropDownList = [];
		const sessionList = $("#session-list");

		// create alphabetically sorted list of saved calcs
		for(let i = 0; i < localStorage.length; i++) {
			if (localStorage.key(i) !== appName) {
				dropDownList.push(localStorage.key(i));
			}
		}		
		dropDownList.sort();

		$(sessionList).empty();
		$("#session-list-container").css("display", (dropDownList.length > 0) ? "block" : "none");

		// create new drop down items from localstorage
		for (let i = 0; i < dropDownList.length; i++) {
			$(sessionList).append(
				$("<a></a>").append(dropDownList[i]).addClass("dropdown-item").attr("href", localStorage.getItem(dropDownList[i]))				
			);
		}

		// add trash icon after each drop down item
		$(".icon-trash").clone().insertAfter(".dropdown-item").show();

		// click event listener for trash icon
		$("#session-list > .icon-trash").on("click", function(e) {
			const key = $(this).prev(".dropdown-item").text();
			localStorage.removeItem(key);
			initSessionList();
		});
	}

	const saveLocalStorage = () => {
		if (sessionName.length > 0) { // && localStorage.getItem(sessionName).length > 0) {
			localStorage.setItem(sessionName, `/?price=${price}&rate=${rate}&months=${timeMonths}&sessionName=${sessionName}`);
			initSessionList();
		}
	}

	const toggleTime = () => {
		monthsDiv.style.display = showMonths ? "none" : "flex";
		yearsDiv.style.display = showMonths ? "flex" : "none";
		showMonths = !showMonths;
	}

	const toggleSessionLabel = (e) => {
		// init session name input field
		if (sessionDiv.innerText.trim() === appName) {
			setSessionName("");
		}

		// default session name input field if necessary
		if (sessionDiv.innerText.trim().length === 0) {
			setSessionName(appName);
		}

		saveLocalStorage();
		sessionDiv.style.display = sessionDiv.style.display === "none" ? "block" : "none";
		sessionInput.style.display = sessionInput.style.display === "none" ? "block" : "none";
		sessionInput.focus();
	}

	const copyWindow = (e) => {
		e.stopPropagation();
		window.open(`/?price=${price}&rate=${rate}&months=${timeMonths}&sessionName=${sessionName}`);
	}

	const checkValues = (values, stateObj) => {

		// handle months time if updated by years field
		if (stateObj.fieldName === "years-input" && parseFloat(values.value)) {
			let timeInMonths = parseInt(parseFloat(values.value) * 12);
			return checkValues({ ...values, value: timeInMonths}, monthsObj);
		}

		// update years time if updated my months field
		if (stateObj.fieldName === "months-input" && parseInt(values.value)) {
			setTimeYears(parseFloat(values.value / 12));
		}

		// hand if value exceeds max amount
		if (values.value > stateObj.maxAmount) {
			values.value = stateObj.maxAmount;
		}

		// update values
		if (values.value <= stateObj.maxAmount) {
			stateObj.updateState(values.value);
			return values;
		}		
	}

	const changeField = (e, value, stateObj) => {
		// up or down arrow pressed
		if (e.keyCode === 38 || e.keyCode === 40) { 
			checkValues({ value : (e.keyCode===38) ? value + stateObj.changeBy : value - stateObj.changeBy }, stateObj);
		}
	}

	const calculateMonthly = ({ amount, interest, months }) => {
	   const userAmount = Number(amount);
	   const calculatedInterest = Number(interest) / 100 / 12;
	   const calculatedPayments = Number(months); 
	   const x = Math.pow(1 + calculatedInterest, calculatedPayments);
	   const monthly = (userAmount * x * calculatedInterest) / (x - 1);

	   if (isFinite(monthly)) {
	     const monthlyPaymentCalculated = monthly.toFixed(2);
	     const totalPaymentCalculated = (monthly * calculatedPayments).toFixed(2);
	     const totalInterestCalculated = (monthly * calculatedPayments - userAmount).toFixed(2);

	     // Set up results to the state to be displayed to the user
	     return{
	       monthlyPayment: monthlyPaymentCalculated,
	       totalPayment: totalPaymentCalculated,
	       totalInterest: totalInterestCalculated,
	       isResult: true,
	     };
	   }
	   return {};
	 };	

  return (
    <div className="App">
      <header className="App-header">
      	<span id="sessionLabel" onClick={toggleSessionLabel}>
      		{sessionName}&nbsp;<FontAwesomeIcon className="cursor-pointer" onClick={copyWindow} icon={faExternalLinkAlt} />
      	</span>
      	<input type="text" className="session-field" style={{display: 'none'}} onBlur={toggleSessionLabel} name="session-input" id="session-input" value={sessionName} onChange={(e) => setSessionName(e.target.value)} />
      </header>

      <div className="container-fluid App-body">
      <FontAwesomeIcon className="icon-trash cursor-pointer" style={{display: 'none'}} icon={faTrashAlt} />
		<div className="btn-group" id="session-list-container">
		  <button type="button" className="btn dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
		    Show
		  </button>
		  <div className="dropdown-menu" id="session-list">
		  	<a href="#" className="dropdown-item">Test </a>
		  </div>
		</div>

      	<form onSubmit={(e) => e.preventDefault()}>
      		<div className="row">
			    <div className="flex">
			     	<span className="currency">$</span>
		      		<NumberFormat name="price-input" thousandSeparator={true} value={price} 
		      		isAllowed={( (values) => checkValues(values, priceObj) )}
		      		onValueChange={(values) => checkValues(values, priceObj)} 
		      		onKeyUp={(event) => changeField(event, parseInt(price), priceObj)} 
		      		/>
	      		</div>
      		</div>

      		<div className="row">
			    <div className="flex">
		      		<NumberFormat className="rate-input" name="rate" thousandSeparator={false} allowLeadingZeros={true} decimalScale={3} fixedDecimalScale={true} 
		      		isAllowed={( (values) => checkValues(values, rateObj) )}
		      		onValueChange={(values) => checkValues(values, rateObj)} value={rate} 
		      		onKeyUp={(event) => changeField(event, parseFloat(rate), rateObj)} />
			     	<span className="rate">%</span>
		      	</div>
	      	</div>

      		<div className="row">
			    <div className="flex" id="months-container" style={{display: showMonths ? 'flex' : 'none'}}>
			     	<span className="currency time-label" onClick={toggleTime}>Months</span>
		      		<NumberFormat name="months-input" thousandSeparator={false} value={timeMonths} 
					isAllowed={( (values) => checkValues(values, monthsObj) )}
		      		onValueChange={(values) => checkValues(values, monthsObj)}
		      		onKeyUp={(event) => changeField(event, parseInt(timeMonths), monthsObj)} />
		      	</div>

			    <div className="flex" id="years-container" style={{display: showMonths ? 'none' : 'flex'}}>
			     	<span className="currency time-label" onClick={toggleTime}>Years</span>
		      		<NumberFormat name="years-input" thousandSeparator={false} value={timeYears} 
					isAllowed={( (values) => checkValues(values, yearsObj) )}
		      		onValueChange={(values) => checkValues(values, yearsObj)}
		      		onKeyUp={(event) => changeField(event, parseInt(timeYears), yearsObj)} />
		      	</div>
	      	</div>

	      	<hr />

	      	<div className="row">
	      		<label className="info">Monthly Payment</label>
	      	</div>
	      	<div className="row">
			    <div className="flex full gray">
			     	<span className="currency">$</span>
		      		<NumberFormat className="result" value={monthlyPayment} displayType={"text"} thousandSeparator={true} />
		      	</div>
	      	</div>

	      	<div className="row">
	      		<label className="info">Total Interest ({timeYears} Yrs)</label>
	      	</div>
	      	<div className="row">
			    <div className="flex full gray">
			     	<span className="currency">$</span>
		      		<NumberFormat className="result" value={totalInterest} displayType={"text"} thousandSeparator={true} />
		      	</div>
	      	</div>

	      	<div className="row">
	      		<label className="info">Total Paid ({timeYears} Yrs)</label>
	      	</div>
	      	<div className="row">
			    <div className="flex full gray">
			     	<span className="currency">$</span>
		      		<NumberFormat className="result" value={totalPayment} displayType={"text"} thousandSeparator={true} />
		      	</div>
	      	</div>

      	</form>

      </div>
    </div>
  );
}

export default App;
