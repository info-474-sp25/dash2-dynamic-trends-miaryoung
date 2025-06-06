// 1: SET GLOBAL VARIABLES
const margin = { top: 50, right: 30, bottom: 60, left: 70 };
const width = 900 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Create SVG containers for both charts
const svg1_line = d3.select("#lineChart1") // If you change this ID, you must change it in index.html too
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const svg2_bar = d3.select("#barChart2")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// (If applicable) Tooltip element for interactivity
// const tooltip = ...

// 2.a: LOAD...
d3.csv("weather.csv").then(data => {
    // 2.b: ... AND TRANSFORM DATA
    data.forEach(d => {
        d.year = new Date(d.date).getFullYear();
        d.month = new Date(d.date).getMonth() + 1;
        d.temp = +d.actual_mean_temp;
    })
    //console.log("data:", data);

    const filteredData1 = data.filter(d => d.year != null
        && d.month != null
        && d.temp != null
        && d.year === 2014
    );

    const filteredData2 = data.filter(d => d.year != null
        && d.month != null
        && d.temp != null
    );

    //console.log("filtered data1:", filteredData1);
    //console.log("filtered data2:", filteredData2);
// GROUP DATA
    const groupedData1 = d3.groups(filteredData1, d => d.city, d => d.month)
    .map(([city, month]) => ({
        city,
        values: month.map(([month, entries]) => ({
            month,
            avgTemp: d3.mean(entries, e => e.temp)
        }))
    }));

    const groupedData2 = d3.rollup(filteredData2, // takes from not null data
        v => d3.mean(v, d=> d.average_precipitation), //take the average of the scores
        d => d.city // category = director
    );

    // console.log("Grouped data 1:", groupedData1);
// FLATTEN DATA
    const flattenedData = groupedData1.flatMap(({ city, values}) =>
        values.map(({ month, avgTemp}) => ({
            month,
            avgTemp,
            city
        }))
    );

    const flattenedData2 = Array.from(groupedData2,
        ([city, average_precipitation]) => ({city,average_precipitation})
        )
        .sort((a, b) => b.average_precipitation - a.average_precipitation);

    // console.log("Final flattened data:", flattenedData);
    console.log("Final flattened data2:", flattenedData2);
    const cities = d3.rollup(filteredData1,
        v => d3.rollup(v,
                values => values.length,
                d => d.month
            ),
        d => d.city
    );

    // console.log("cities:", cities);

    // 3.a: SET SCALES FOR CHART 1

    let xMonth = d3.scaleLinear()
    .domain([7, d3.max(flattenedData, d => d.month)])
    .range([0, width]);

    let yTemp = d3.scaleLinear()
    .domain([0, d3.max(flattenedData, d => d.avgTemp)])
    .range([height,0]);

    filteredFlattenedData = flattenedData.filter(d => d.city === "Chicago");
    filteredFlattenedData.sort((a, b) => a.month - b.month);

    // console.log("filteredFlattenedData:", filteredFlattenedData);

    // 4.a: PLOT DATA FOR CHART 1

    const selectedCategory = filteredFlattenedData;

    svg1_line.selectAll("path.data-line")
            .data([filteredFlattenedData]) // Bind the filtered data as a single line
            .enter()
            .append("path")
            .attr("class", "data-line")
            .attr("d", d3.line()
                .x(d => xMonth(d.month))
                .y(d => yTemp(d.avgTemp))
            )
            .style("stroke", "steelblue")
            .style("fill", "none")
            .style("stroke-width", 2);

    // 5.a: ADD AXES FOR CHART 1

    const monthMap = {
        7: "July", 8: "August",
        9: "September", 10: "October", 11: "November", 12: "December"
        };

    svg1_line.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xMonth)
    .tickFormat(d => monthMap[d] || "")
    );

     svg1_line.append("g")
        .call(d3.axisLeft(yTemp)
         .tickFormat(d => d )
    );


    // 6.a: ADD LABELS FOR CHART 1

    // 7.b: X-axis label (Month)
    svg1_line.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", height + (margin.bottom / 2) + 10)
        .text("Month")

    // 7.c: Y-axis label
    svg1_line.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", (-margin.left / 2) - 10)
        .attr("x", -height / 2)
        .text("Average Temperature (Fahrenheit)")

    // 7.a: ADD INTERACTIVITY FOR CHART 1

    // // Tooltip
    const tooltip = d3.select("body") // Create tooltip
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "rgba(0, 0, 0, 0.7)")
        .style("color", "white")
        .style("padding", "10px")
        .style("border-radius", "5px")
        .style("font-size", "12px");

    svg1_line.selectAll(".data-point") // Create tooltip events
        .data(filteredFlattenedData) // Bind only the filtered STEM data
        // .data(selectedCategory) // D7: Bind only to category selected by dropdown menu
        .enter()
        .append("circle")
        .attr("class", "data-point")
        .attr("cx", d => xMonth(d.month))
        .attr("cy", d => yTemp(d.avgTemp))
        .attr("r", 10)
        .style("fill", "steelblue")
        .style("opacity", 0)  // Make circles invisible by default
        // --- MOUSEOVER ---
        .on("mouseover", function(event, d) {
            tooltip.style("visibility", "visible")
                .html(`<strong>Month:</strong> ${d.month} <br><strong>Average Temperature:</strong> ${d.avgTemp}`)
                .style("top", (event.pageY + 10) + "px") // Position relative to pointer
                .style("left", (event.pageX + 10) + "px");

            // Create the large circle at the hovered point
            svg1_line.append("circle")
                .attr("class", "hover-circle")
                .attr("cx", xMonth(d.month))  // Position based on the xScale (year)
                .attr("cy", yTemp(d.avgTemp)) // Position based on the yScale (count)
                .attr("r", 6)  // Radius of the large circle
                .style("fill", "steelblue") // Circle color
                .style("stroke-width", 2);
        })
        // --- MOUSEOUT ---
        .on("mouseout", function() {
            tooltip.style("visibility", "hidden");

            // Remove the hover circle when mouseout occurs
            svg1_line.selectAll(".hover-circle").remove();

            // Make the circle invisible again
            d3.select(this).style("opacity", 0);  // Reset opacity to 0 when not hovering
        });

    function updateChart(selectedCategory) {
        // D3.2: Filter the data based on the selected category
        var selectedCategoryData = flattenedData.filter(function(d) {
            return d.city === selectedCategory;
        });


        // .3: Remove existing lines
        // D3.3: Remove existing lines
        svg1_line.selectAll("path.data-line").remove();  // Remove previous lines

        // redraw lines
        svg1_line.selectAll("path.data-line")
            .data([selectedCategoryData]) // Bind the filtered data as a single line
            .enter()
            .append("path")
            .attr("class", "data-line")
            .attr("d", d3.line()
                .x(d => xMonth(d.month))
                .y(d => yTemp(d.avgTemp))
            )
            .style("stroke", "steelblue")
            .style("fill", "none")
            .style("stroke-width", 2);

        // remove points
        svg1_line.selectAll(".data-point").remove();

        // readd tooltip
        svg1_line.selectAll(".data-point") // Create tooltip events
        // .data(filteredFlattenedData) // Bind only the filtered STEM data
        .data(selectedCategoryData) // D7: Bind only to category selected by dropdown menu
        .enter()
        .append("circle")
        .attr("class", "data-point")
        .attr("cx", d => xMonth(d.month))
        .attr("cy", d => yTemp(d.avgTemp))
        .attr("r", 10)
        .style("fill", "steelblue")
        .style("opacity", 0)  // Make circles invisible by default
        // --- MOUSEOVER ---
        .on("mouseover", function(event, d) {
            tooltip.style("visibility", "visible")
                .html(`<strong>Month:</strong> ${d.month} <br><strong>Average Temperature:</strong> ${d.avgTemp}`)
                .style("top", (event.pageY + 10) + "px") // Position relative to pointer
                .style("left", (event.pageX + 10) + "px");

            // Create the large circle at the hovered point
            svg1_line.append("circle")
                .attr("class", "hover-circle")
                .attr("cx", xMonth(d.month))  // Position based on the xScale (year)
                .attr("cy", yTemp(d.avgTemp)) // Position based on the yScale (count)
                .attr("r", 6)  // Radius of the large circle
                .style("fill", "steelblue") // Circle color
                .style("stroke-width", 2);
        })
        // --- MOUSEOUT ---
        .on("mouseout", function() {
            tooltip.style("visibility", "hidden");

            // Remove the hover circle when mouseout occurs
            svg1_line.selectAll(".hover-circle").remove();

            // Make the circle invisible again
            d3.select(this).style("opacity", 0);  // Reset opacity to 0 when not hovering
        });

    }
    // Event listener for when the dropdown selection changes
    d3.select("#categorySelect").on("change", function() {
        var selectedCategory = d3.select(this).property("value");
        updateChart(selectedCategory); // Update the chart based on the selected option
    });

    // ==========================================
    //         CHART 2 (if applicable)
    // ==========================================

    // 3.b: SET SCALES FOR CHART 2
    const xBarScale = d3.scaleBand()
        .domain(flattenedData2.map(d => d.city)) // Use city names as categories
        .range([0, width])
        .padding(0.1); // Add space between bars
    
    const yBarScale = d3.scaleLinear()
        .domain([0, d3.max(flattenedData2, d => d.average_precipitation)])
        .range([height, 0]); // START high, DECREASE

    // 4.b: PLOT DATA FOR CHART 2
    svg2_bar.selectAll("rect")
        .data(flattenedData2)
        .enter()
        .append("rect")
        .attr("x", d => xBarScale(d.city)) // horizontal position
        .attr("y", d => yBarScale(d.average_precipitation)) // vertical position
        .attr("width", xBarScale.bandwidth())
        .attr("height", d => height - yBarScale(d.average_precipitation))
        .attr("fill", "blue")
        ;

    // 5.a: ADD AXES FOR CHART 
    svg2_bar.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xBarScale));

    // 5.b: Y-axis (Gross)
    svg2_bar.append("g")
    .call(d3.axisLeft(yBarScale));

    // 6.b: ADD LABELS FOR CHART 2
    // 6.a: X-axis (Cities)
    svg2_bar.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2) // This is correct for the inner chart area
        .attr("y", height + (margin.bottom / 2) + 10 )
        //.attr("text-anchor", "middle") // Add this for perfect centering
        .text("Cities");
    //Y-axis label (Total Gross)
    svg2_bar.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)") // Rotate for vertical label
        .attr("y", (-margin.left / 2) - 10) // Adjust for margin
        .attr("x", -height / 2) // Center vertically
        .text("Average Precipitation (inches)");


});