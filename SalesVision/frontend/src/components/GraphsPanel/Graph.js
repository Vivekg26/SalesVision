import React, { useState, useEffect, useCallback } from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import AccessibilityModule from 'highcharts/modules/accessibility'
import axios from 'axios'
import './Graph.css'

AccessibilityModule(Highcharts)

const Graph = (props) => {
  const [data, setData] = useState([])
  const [chartOptions, setChartOptions] = useState({
    title: {
      text: 'Forecast',
    },
    xAxis: {
      title: {
        text: 'Date',
      },
      crosshair: {
        color: 'grey',
        width: 0.5,
        dashStyle: 'Dash',
      },
    },
    yAxis: {
      title: {
        text: 'Sales',
      },
      crosshair: {
        color: 'grey',
        width: 0.5,
        dashStyle: 'Dash',
      },
    },
    series: [
      {
        name: 'Forecasted Data',
        data: [5, 10, 15, 20, 25],
      },
    ],
  })

  const updateGraphData = (props) => {
    var actualSales = []
    var forecastedSales = []
    if (props.value === 60) {
      for (let i = 0; i < 60; i++) {
        actualSales.push(props.data[i])
        forecastedSales.push(null)
      }
      for (let i = 60; i < props.data.length; i++) {
        forecastedSales.push(props.data[i])
      }
    } else if (props.value === 8) {
      for (let i = 0; i < 8; i++) {
        actualSales.push(props.data[i])
        forecastedSales.push(null)
      }
      actualSales.push(props.data[8])
      for (let i = 8; i < props.data.length; i++) {
        forecastedSales.push(props.data[i])
      }
    } else {
      for (let i = 0; i < 2; i++) {
        actualSales.push(props.data[i])
        forecastedSales.push(null)
      }
      actualSales.push(props.data[2])
      actualSales.push(props.data[8])
      for (let i = 2; i < props.data.length; i++) {
        forecastedSales.push(props.data[i])
      }
    }

    setChartOptions({
      series: [
        // { data: props.data },
        {
          data: actualSales, // First data series
          name: 'Actuals',
          color: 'red', // Set color for the first data series
        },
        {
          data: forecastedSales, // Second data series
          name: 'Forecasted',
          color: 'blue', // Set color for the second data series
        },
      ],
      xAxis: {
        categories: props.labels,
        plotLines: [
          {
            color: 'black',
            width: 3,
            value: props.value,
            label: {
              text: 'Today',
              verticalAlign: 'top',
              rotation: 0,
            },
            zIndex: -1,
          },
        ],
      },
    })
  }

  const handleFrequencyChange = useCallback(
    (event) => {
      if (data.length === 0) {
        return
      }
      if (event.target.value === 'daily') {
        const today = new Date()
        const dateLabels = []

        for (let i = -60; i <= 120; i++) {
          const date = new Date()
          date.setDate(today.getDate() + i)
          dateLabels.push(date.toLocaleDateString())
        }
        updateGraphData({ data: data, value: 60, labels: dateLabels })
      } else if (event.target.value === 'weekly') {
        const newAverageArray = []
        const previousAverageArray = []
        for (let i = 0; i < 56; i += 7) {
          const range = data.slice(i, i + 7)
          const sum = range.reduce((acc, num) => acc + num, 0)
          previousAverageArray.push(sum)
        }
        for (let i = 60; i < 179; i += 7) {
          const range = data.slice(i, i + 7)
          const sum = range.reduce((acc, num) => acc + num, 0)
          newAverageArray.push(sum)
        }
        newAverageArray.unshift(...previousAverageArray)
        const today = new Date()
        const dateLabels = []

        for (let i = -60; i <= 120; i++) {
          const startDate = new Date()
          startDate.setDate(today.getDate() + i * 7) // Multiply by 7 to get weekly interval

          const startDateLabel = startDate.toLocaleDateString()
          dateLabels.push(startDateLabel)
        }
        updateGraphData({ data: newAverageArray, value: 8, labels: dateLabels })
      } else if (event.target.value === 'monthly') {
        const newMonthlyArray = []
        for (let i = 0; i < 180; i += 30) {
          const range = data.slice(i, i + 30)
          const sum = range.reduce((acc, num) => acc + num, 0)
          newMonthlyArray.push(sum)
        }
        const today = new Date()
        const currentMonth = today.getMonth()
        const monthLabels = []

        function getMonthName(monthIndex) {
          const monthNames = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
          ]
          return monthNames[monthIndex]
        }

        for (let i = currentMonth - 2; i <= currentMonth + 4; i++) {
          const monthIndex = (i + 12) % 12 // Ensure the index stays within 0-11 range
          monthLabels.push(getMonthName(monthIndex))
        }
        updateGraphData({
          data: newMonthlyArray,
          value: 2,
          labels: monthLabels,
        })
      }
    },
    [data]
  )

  const handleGenerateClick = async () => {
    if (props.selectedOptions.length === 0) {
      console.warn('Choose an option first')
      window.alert('Choose an option first')
      return
    }
    const selectedAlgorithm = document.getElementById('algorithm').value
    try {
      const response = await axios.post(
        `http://localhost:5000/prediction`,
        {
          algorithm: selectedAlgorithm,
          options: props.selectedOptions,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      setData(response.data)
    } catch (error) {
      console.warn(error.message)
    }
  }

  useEffect(() => {
    const selectedFrequency = document.getElementById('frequency').value
    handleFrequencyChange({ target: { value: selectedFrequency } })
  }, [data, handleFrequencyChange])

  return (
    <div className='graph-container'>
      <div className='dropdown-container'>
        <select className='styled-dropdown' id='algorithm'>
          <option value='Smoothing' title='Tooltip text for Algorithm 1'>
            Smoothing
          </option>
          <option value='Arima' title='Tooltip text for Algorithm 2'>
            Arima
          </option>
          <option value='Sarima' title='Tooltip text for Algorithm 3'>
            Sarima
          </option>
          <option value='Prophet' title='Tooltip text for Algorithm 4'>
            Prophet
          </option>
        </select>
        <select
          className='styled-dropdown'
          id='frequency'
          onChange={handleFrequencyChange}
        >
          <option value='daily'>Daily</option>
          <option value='weekly'>Weekly</option>
          <option value='monthly'>Monthly</option>
        </select>
        <button className='right-panel-button' onClick={handleGenerateClick}>
          Generate
        </button>
      </div>
      <HighchartsReact highcharts={Highcharts} options={chartOptions} />
    </div>
  )
}

export default Graph
