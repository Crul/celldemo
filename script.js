var rule = 0;
var starting = "i";
var scrollmode = "scroll";
var canvasdiv, canvastable;
var currstate, nextstate;
var timer;
var currrow = 0;
var squaresize;
var width, height;

$(document).ready(init);

function init() {
    canvasdiv = $("#canvasdiv")[0];
    canvastable = $("#canvastable tbody");
	canvastable.click(oncellclick);
    rule_set(4);
    restart();
}

function oncellclick(ev) {
	var targetcell = ev.target;
	if (targetcell.tagName != "TD")
		return;
	
	var rowindex = $(targetcell.parentElement).index();
	if (rowindex != currrow)
		return;
	
	var cell = $(targetcell);
	var cellindex = cell.index();
	currstate[cellindex] = !currstate[cellindex];
	cell.css("backgroundColor", (currstate[cellindex] ? "#000" : "#fff"));
}

function next_step(){
	if (!timer)
		next_row();
}

function next_row() {
    for (var i = 0; i < width; i++) {
        //calculate each cell in the next state of the simulation
        var l, c, r;
        if (i == 0) {
            l = false; c = currstate[0]; r = currstate[1];
        } else if (i == width - 1) {
            l = currstate[i-1]; c = currstate[i]; r = false;
        } else {
            l = currstate[i-1]; c = currstate[i]; r = currstate[i+1];
        }
		
        var n = 0;
        if (l == true) n |= 4;
        if (c == true) n |= 2;
        if (r == true) n |= 1;

        nextstate[i] = (rule & Math.pow(2, n)) > 0;
	}
	
    for (var i = 0; i < width; i++)
        currstate[i] = nextstate[i];
	
	draw_row();
	
    if (timer) setTimeout(next_row, 10);
}

function draw_row() {
	$(".currrow").removeClass("currrow");
	currrow++;
	if (currrow < height) {
		var currrowelem = $(canvastable.find("tr").get(currrow));
		currrowelem.empty();
	} else {
		switch(scrollmode) {
			case "scroll":
				canvastable.find("tr:first").remove();
				// break; ------------------ NO BREAK
				
			case "append":
				var currrowelem = $("<tr>");
				canvastable.append(currrowelem);
				break;
				
				
			case "redraw":
				currrow %= height;
				var currrowelem = $(canvastable.find("tr").get(currrow));
				currrowelem.empty();
				break;
		}
	}
	
    for (var i = 0; i < width; i++) {
		currrowelem.append($("<td>")
			.css("backgroundColor", (currstate[i] ? "#000" : "#fff")));
    }
	
	currrowelem.addClass("currrow");
	canvasdiv.scrollTop = canvasdiv.scrollHeight;
}

function restart() {
	stop();
	setTimeout(clear_all, 15);
}

function oncellhover(ev) {	
	var rowindex = $(ev.target.parentElement).index();
	if (rowindex != currrow + 1)
		return;
	
	var cell = $(ev.target).addClass("nextcell");
	var cellindex = cell.index();
	var parentcells = $(ev.target.parentElement.parentElement)
		.find("tr")
		.eq(rowindex-1)
		.find("td");
	
	var cellparentleft = (cellindex == 0 ? undefined : parentcells.eq(cellindex-1));
	var cellparentcenter = parentcells.eq(cellindex);
	var cellparentright = (cellindex == (width - 1) ? undefined : parentcells.eq(cellindex+1));
	
	cellparentleft.addClass("nextcellparent");
	cellparentcenter.addClass("nextcellparent");
	cellparentright.addClass("nextcellparent");
	
	var bincomp = iscellactive(cellparentleft) ? "1" : "0";
	bincomp += iscellactive(cellparentcenter) ? "1" : "0";
	bincomp += iscellactive(cellparentright) ? "1" : "0";
	
	console.log(bincomp);
	var isnextactive = $("#rcc" + bincomp).is(":checked");
	$("#rct" + bincomp).addClass("active" + (isnextactive ? "on" : "off"));
	
	if (isnextactive)
		cell.addClass("nextcellon");
}

function iscellactive(cell) {
	return cell && cell.css("backgroundColor") == "rgb(0, 0, 0)"
}

function oncellhoverout() {
	$(".activeon").removeClass("activeon");
	$(".activeoff").removeClass("activeoff");
	$(".nextcell").removeClass("nextcell").removeClass("nextcellon");
	$(".nextcellparent").removeClass("nextcellparent");
}

function clear_all() {
    squaresize = parseInt($("#squaresize").val());
	canvastable.parent().attr("class", "s" + squaresize);
	width = Math.floor(window.innerWidth / (squaresize + 1));
	height = Math.floor(canvasdiv.clientHeight / squaresize) - 1;
	
    canvastable.empty();
    for (var h = 0; h < height; h++) {
		var newrow = $("<tr>");
		for (var w = 0; w < width; w++) {
			newrow.append($("<td>"));
		}
		newrow.find("td").hover(oncellhover, oncellhoverout);
		canvastable.append(newrow);
	}
	
    //init the state arrays
    currstate = new Array(width);
    nextstate = new Array(width);

    var impulse = document.getElementsByName("impulse[]");

    for (var i = 0; i < width; i++) {
        switch (starting) {
            case "i":
                if ((i == 0 && impulse[0].checked)
                    || (i == Math.floor(width/2)-1 && impulse[1].checked)
                    || (i == (width - 1) && impulse[2].checked))
                    currstate[i] = true;
                else currstate[i] = false;
                break;
            case "25":
                if (i % 4)
                    currstate[i] = false;
                else currstate[i] = true;
                break;
            case "50":
                if (i % 2)
                    currstate[i] = false;
                else currstate[i] = true;
                break;
            case "75":
                if (i % 4)
                    currstate[i] = true;
                else currstate[i] = false;
                break;
            case "r":
                if (Math.floor(Math.random() * 2))
                    currstate[i] = true;
                else currstate[i] = false;
                break;
        }
    }
    currrow = -1;
	draw_row();
}

function start(){
    if (!timer)
		timer = setTimeout(next_row, 10);
}

function stop() {
    timer = clearTimeout(timer);
}

function rule_xor(num) {
    //turn on or off one of the next-state rules
    // where num is a power of 2 corresponding to one of the bits in the rule number
	if ((rule & num) == 0) {
		$("#rc" + num).show();
	} else {
		$("#rc" + num).hide();
	}
	
    rule ^= num;
    document.getElementById("rule_").innerHTML = rule + "";
}

function rule_set(num) {
    //set the simulation's next state rule set to a certain Wolfram number
    rule = Math.floor(num % 256);
    document.getElementById("rule_").innerHTML = rule + "";

    //set or clear each checkbox on the page
    var checks = document.getElementsByName("rule[]");
	$(".rulecomponents td span").hide();
    for (var i = 0; i < 8; i++) {
		var component = (rule & Math.pow(2, 7-i));
		if (component > 0) {
			$("#rc" + component).show();
		}
		
        checks[i].checked = (component > 0);
	}
}