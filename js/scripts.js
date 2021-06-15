$(function () {
	var dataColumns=["date","app","platform","impressions","clicks","installs","dau","revenue"]
	var dataNumericColumns=["impressions","clicks","installs","dau","revenue"]
	//DatePicker plugin
    $('#dateSelector').daterangepicker({
        opens: 'left'
      })
	//Select plugin
    $('.select2').select2({
        theme: 'bootstrap4'
    })

	const getData = async () => {
		//Fetch URL
		let url = `https://recruitment-mock-data.gjg-ads.io/data`;
		let response = await fetch(url);
		let data = await response.json();
		data=data["data"]
		// Loop data
        var uniqueApps=[]
		data.forEach((data) => {
			// Render data to the table
			document.getElementById('all-datas').innerHTML =
				`
            <tr>
                    <td >${data.date}</td>
                    <td >${data.app}</td>
                    <td >${data.platform}</td>
                    <td >${data.impressions}</td>
                    <td >${data.clicks}</td>
                    <td >${data.installs}</td>
                    <td >${data.dau}</td>
                    <td >${data.revenue}</td>
            </tr>
            ` + document.getElementById('all-datas').innerHTML;
            // Add unique app names to the filter
            if (!uniqueApps.includes(data.app)){
                document.getElementById("appSelector").innerHTML=`<option>${data.app}</option>`+document.getElementById("appSelector").innerHTML
                uniqueApps.push(data.app)
            }
		});
	};

	// Filter rows and hide columns
	$('#filterTable').on('click', function () {
		var dateFrom=$("#dateSelector").val().split(" - ")[0],
			dateTo = $("#dateSelector").val().split(" - ")[1];

		//Get days function
		var getDaysBetweenDates = function(startDate, endDate) {
			var now = startDate.clone(), dates = [];
			while (now.isSameOrBefore(endDate)) {
				dates.push(now.format('YYYY/MM/DD'));
				now.add(1, 'days');
			}
			return dates;
		};

		//Create search queries to filter data
		var dateQuery = getDaysBetweenDates(moment(dateFrom), moment(dateTo));
        var appQuery=""
        var platformQuery=""
		dateQuery.forEach(element=>{
			if (dateQuery.length>0){dateQuery=dateQuery+"|"+element}
            else {dateQuery=element}
		})
        $("#appSelector").select2("val").forEach(element =>{
            if (appQuery.length>0){appQuery=appQuery+"|"+element}
            else {appQuery=element}
        })
        $("#platformSelector").select2("val").forEach(element =>{
            if (platformQuery.length>0){platformQuery=platformQuery+"|"+element}
            else {platformQuery=element}
        })
		// Search queries in table
		$('#table').DataTable().column(0).search(dateQuery.replaceAll("/", "-").replaceAll(",", "|"), true, false);
		$('#table').DataTable().column(1).search(appQuery, true, false);
		$('#table').DataTable().column(2).search(platformQuery, true, false);


		//Create hidden columns queries
        var hiddenColumns=[]
        var shownColumns=[]
        if(!$('#date').is(':checked')){hiddenColumns.push(0)}else{shownColumns.push(0)}
        if(!$('#app').is(':checked')){hiddenColumns.push(1)}else{shownColumns.push(1)}
        if(!$('#platform').is(':checked')){hiddenColumns.push(2)}else{shownColumns.push(2)}
        if(!$('#impressions').is(':checked')){hiddenColumns.push(3)}else{shownColumns.push(3)}
        if(!$('#clicks').is(':checked')){hiddenColumns.push(4)}else{shownColumns.push(4)}
        if(!$('#installs').is(':checked')){hiddenColumns.push(5)}else{shownColumns.push(5)}
        if(!$('#dau').is(':checked')){hiddenColumns.push(6)}else{shownColumns.push(6)}
        if(!$('#revenue').is(':checked')){hiddenColumns.push(7)}else{shownColumns.push(7)}

		// Hide unselected columns
		hiddenColumns.forEach((columnIndex) => {
			$('#table').DataTable().column(columnIndex).visible(false);
		});
		// Show selected columns
		shownColumns.forEach((columnIndex) => {
			$('#table').DataTable().column(columnIndex).visible(true);
		});
		// Redraw table
		$('#table').DataTable().page('first')
		$('#table').DataTable().columns.adjust().draw(false);
	
		// Send filtered data to graph function
		var filteredData=$('#table').DataTable().rows({filter:"applied"}).data()
		drawGraphs(filteredData,shownColumns,hiddenColumns)
	});

	//Get random color for chart lines
	function getRandomColor() {
		var letters = '0123456789ABCDEF';
		var color = '#';
		for (var i = 0; i < 6; i++) {
		  color += letters[Math.floor(Math.random() * 16)];
		}
		return color;
	}

	//Graph draw function
	const drawGraphs = (filteredData,shownColumns,hiddenColumns)=>{
		console.log(filteredData)
		filteredData.sort((function(index){
			return function(a, b){
				return (a[index] === b[index] ? 0 : (a[index] < b[index] ? -1 : 1));
			};
		})(0)); // 2 is the index
		if(shownColumns==undefined)shownColumns=[0]
		var tableData={}
		var areaChartData = {labels:[],datasets:[]}
		//Calculate lines with filtered data
		for(i=0;i<Object.keys(filteredData).length;i++){
			if (filteredData[i]) {
				var k=3
				if(!tableData[filteredData[i][0]]){
					tableData[filteredData[i][0]]=[]
					dataNumericColumns.forEach(col=>{
						tableData[filteredData[i][0]][col]=parseFloat(filteredData[i][k])
						k++
					})
				}else{
					dataNumericColumns.forEach(col=>{
						tableData[filteredData[i][0]][col]=tableData[filteredData[i][0]][col]+parseFloat(filteredData[i][k])
						k++
					})
				}
			}
		}
		//Create Lines
		dataNumericColumns.forEach(col=>{
			areaChartData.datasets.push({label:col,data:[],borderColor:getRandomColor(),fill: false})
		})
		//Push calculated values to the graph
		Object.entries(tableData).forEach(([key, value]) => {
			areaChartData.labels.push(key)
			Object.entries(value).forEach(([keyV, valueV]) => {
				areaChartData.datasets.forEach(el=>{
					if(el.label==keyV){
						el.data.push(valueV)
					}
				})
			});
		});
		//Create new canvas
		$("#canvas-div").html(`<canvas id="platformChart" width="702" height="500" class="chartjs-render-monitor"></canvas>`)
		 var areaChartCanvas = $('#platformChart').get(0).getContext('2d')
		 var areaChartOptions = {
			maintainAspectRatio : false,
		   responsive : true,    
		   legend: {
			 display: true
		   },
		   scales: {
			xAxes: [{
				type: 'time',
                time: {
                    unit: 'day'
                }
			}]
		  }
		 }
		 var chart = new Chart(areaChartCanvas, {
		   type: 'line',
		   data: areaChartData,
		   options: areaChartOptions
		 })
		 //Hide unselected lines
		 try {
			chart.data.datasets.forEach(function(ds) {
				hiddenColumns.forEach(function(col){
					if(dataColumns[col]==ds.label)ds.hidden=true
				})
			  });
			  chart.update();
		 } catch (error) {}
 	}	



	// Reset filters
	$('#resetTable').on('click', function () {
		// Show all columns
		for (i = 0; i < 8; i++) {
			$('#table').DataTable().column(i).visible(true);
		}
		// Remove all filters
		$('#table').DataTable().search('').columns().search('');
		// Redraw table
		$('#table').DataTable().columns.adjust().draw(false);
		$('#table').DataTable().column(1).visible(false);
        $('#table').DataTable().column(2).visible(false);
		// Redraw graph
		var filteredData=$('#table').DataTable().rows({filter:"applied"}).data()
		drawGraphs(filteredData)
		$("#dateSelector").val("05/01/2020 - 08/01/2020")
		$('#platformSelector').val(null).trigger('change');
		$('#appSelector').val(null).trigger('change');
		$('#date').val(false);
	});

	// Switch between table and graph
	$("#switch").change( function(){
		if($('#switch').is(':checked')==true){
			$("#graph-card").css("position", "relative");
			$("#graph-card").css("visibility", "visible");
			$("#table-card").css("position", "absolute");
			$("#table-card").css("visibility", "hidden");
			$(".checkboxes").css("opacity", "50%");
			$(".checkboxes-input").prop('disabled', true)
		}else{
			$("#table-card").css("position", "relative");
			$("#table-card").css("visibility", "visible");
			$("#graph-card").css("position", "absolute");
			$("#graph-card").css("visibility", "hidden");
			$(".checkboxes").css("opacity", "100%");
			$(".checkboxes-input").prop('disabled', false)
		}
	} )


	


	//Take data and render to the table on first run
	const runPage = async () => {
		await getData();
		// Create DataTable with our filtered data
		$('#table')
			.DataTable({
				responsive: true,
				lengthChange: true,
				autoWidth: true,
				search: { regex: true },
				oLanguage: {
					sSearch: 'Search in Table: ',
				},
				buttons: [
					{
						extend: 'copy',
						text: 'Copy',
						className: 'tableButton',
					},
					{
						extend: 'print',
						text: 'Print',
						className: 'tableButton',
					},
					{
						extend: 'csv',
						text: 'CSV',
						className: 'tableButton',
					},
					{
						extend: 'excel',
						text: 'Excel',
						className: 'tableButton',
					},
					{
						extend: 'pdf',
						text: 'PDF',
						className: 'tableButton',
					},
				],
			})
			.buttons()
			.container()
			.appendTo('.dataTables_length');
        $('#table').DataTable().column(1).visible(false);
        $('#table').DataTable().column(2).visible(false);
		//Create graph with our filtered datas
		var filteredData=$('#table').DataTable().rows({filter:"applied"}).data()
		drawGraphs(filteredData)

		$("#loading-page").css("z-index",-1)
		$("#loading-page").css("visibility","hidden")
	};
	//Run
	runPage();
});
