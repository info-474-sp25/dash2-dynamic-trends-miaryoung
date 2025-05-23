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
    console.log(data);

    const filteredData1 = data.filter(d => d.year != null
        && d.month != null
        && d.temp != null
        && d.year === 2014
        && d.city === "Chicago"
    );
    
// GROUP DATA
    const groupedData1 = d3.groups(filteredData1, d => d.city, d => d.month)
    .map(([city, month]) => ({
        city,
        values: month.map(([month, entries]) => ({
            month,
            avgTemp: d3.mean(entries, e => e.temp)
        }))
    }));

    console.log("Grouped data 1:", groupedData1);
// FLATTEN DATA
    const flattenedData = groupedData1.flatMap(({ city, values}) =>
        values.map(({ month, avgTemp}) => ({
            month,
            avgTemp,
            city
        }))
    );

    console.log("Final flattened data:", flattenedData);

    const dataMap = d3.rollup(filteredData1,
        v => d3.mean(v, d => d.temp),
        d => d.month
    );

    const dataArr = Array.from(dataMap,
        ([month, temp]) => ({month, temp})
    )
    .sort((a, b) => a.month - b.month);

    // 3.a: SET SCALES FOR CHART 1

    let xMonth = d3.scaleLinear()
    .domain([7, d3.max(dataArr, d => d.month)])
    .range([0, width]);

    let yTemp = d3.scaleLinear()
    .domain([0, d3.max(dataArr, d => d.temp)])
    .range([height,0]);

    // 4.a: PLOT DATA FOR CHART 1
    const line = d3.line()
        .x(d => xMonth(d.month))
        .y(d => yTemp(d.temp));

    svg1_line.append("path")
		.datum(dataArr)
        .attr("d", line)
        .attr("stroke", "blue")
        .attr("stroke-width", 5)
        .attr("fill", "none");

    // 5.a: ADD AXES FOR CHART 1
    // svg1_line.append("g")
    //     .attr("transform", `translate(0,${height})`)
    //     .call(d3.axisBottom(xMonth)
    //     .tickFormat(d3.format("d"))
    //     		     .tickValues(d3.range(
    //             	d3.min(dataArr, d => d.month),
    //             	d3.max(dataArr, d => d.month) + 1
    //         ))

    
    // );

    const monthMap = {
        7: "July", 8: "August",
        9: "September", 10: "October", 11: "November", 12: "December"
        };

    svg1_line.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xMonth)
        .tickFormat(d => monthMap[d] || d)
    )

     svg1_line.append("g")
        .call(d3.axisLeft(yTemp)
         .tickFormat(d => d )
    );


    // 6.a: ADD LABELS FOR CHART 1
    // svg1_line.append("text")
    //     .attr("class", "title")
    //     .attr("x", width / 2)
    //     .attr("y", -margin.top / 2)
    //     .text("")

    // 7.b: X-axis label (Year)
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
    

    // ==========================================
    //         CHART 2 (if applicable)
    // ==========================================

    // 3.b: SET SCALES FOR CHART 2


    // 4.b: PLOT DATA FOR CHART 2


    // 5.b: ADD AXES FOR CHART 


    // 6.b: ADD LABELS FOR CHART 2


    // 7.b: ADD INTERACTIVITY FOR CHART 2


});