import timetableJson from "./TimeTable_4_18_23_53.json" with {type:"json"}
import { 
  findNextBuses ,
  keioRapid,
  minuteToTime
} from "./timeHandlers.js"
import holidayJson from "./Holidays.json" with {type:"json"}

const $=q=>document.querySelector(q)
const $$=q=>document.querySelectorAll(q)

const stationNamesMapping={nishihachioji:"西八王子",mejirodai:"めじろ台",aihara:"相原"}

const facilitiesTimesMapping = {
  economics: 5,
  health: 4,
  sport: 8,
  gym: 15,
}
let [now,station,isComingToHosei]=[new Date(),"nishihachioji",true]

const renderHTML=({now,station,isComingToHosei})=>{

  let result=findNextBuses({
    currentDate:now,
    holidayData:holidayJson,
    isComingToHosei,
    length:3,
    station,
    timetable:keioRapid({timetable:timetableJson})
  })
  
  let [futureFirst,futureSecond,futureThird]=result
  
  $("#first-card .future .first .departure").textContent=minuteToTime(futureFirst.leaveHour*60+futureFirst.leaveMinute)
  $("#first-card .future .second .departure").textContent=minuteToTime(futureSecond.leaveHour*60+futureSecond.leaveMinute)
  $("#first-card .future .third .departure").textContent=minuteToTime(futureThird.leaveHour*60+futureThird.leaveMinute)
  
  $("#first-card .future .first .arrival").textContent=minuteToTime(futureFirst.arriveHour*60+futureFirst.arriveMinute)
  $("#first-card .future .second .arrival").textContent=minuteToTime(futureSecond.arriveHour*60+futureSecond.arriveMinute)
  $("#first-card .future .third .arrival").textContent=minuteToTime(futureThird.arriveHour*60+futureThird.arriveMinute)
  
  result=findNextBuses({
    currentDate:now,
    holidayData:holidayJson,
    isComingToHosei,
    length:-2,
    station,
    timetable:keioRapid({timetable:timetableJson})
  })
  
  const [pastSecond,pastFirst]=result
  
  $("#first-card .past .first .departure").textContent=minuteToTime(pastFirst.leaveHour*60+pastFirst.leaveMinute)
  $("#first-card .past .second .departure").textContent=minuteToTime(pastSecond.leaveHour*60+pastSecond.leaveMinute)
  
  $("#first-card .past .first .arrival").textContent=minuteToTime(pastFirst.arriveHour*60+pastFirst.arriveMinute)
  $("#first-card .past .second .arrival").textContent=minuteToTime(pastSecond.arriveHour*60+pastSecond.arriveMinute)
  
  if(isComingToHosei){
    $(".directions-container .departure").textContent=stationNamesMapping[station]
    $(".directions-container .arrival").textContent="法政大学"
  }else{
    $(".directions-container .departure").textContent="法政大学"
    $(".directions-container .arrival").textContent=stationNamesMapping[station]
  }

  $(".overlay-economics>span").textContent=minuteToTime(futureFirst.arriveHour*60+futureFirst.arriveMinute+facilitiesTimesMapping.economics)
  $(".overlay-social>span").textContent=minuteToTime(futureFirst.arriveHour*60+futureFirst.arriveMinute+facilitiesTimesMapping.health)
  $(".overlay-gym>span").textContent=minuteToTime(futureFirst.arriveHour*60+futureFirst.arriveMinute+facilitiesTimesMapping.gym)
  $(".overlay-sport>span").textContent=minuteToTime(futureFirst.arriveHour*60+futureFirst.arriveMinute+facilitiesTimesMapping.sport)
}

const render=()=>{
  renderHTML({station,now,isComingToHosei})
}

render()

$("[data-station='nishihachioji']").addEventListener("click",e=>{
  station="nishihachioji"
  render()
})
$("[data-station='mejirodai']").addEventListener("click",e=>{
  station="mejirodai"
  render()
})
$("[data-station='aihara']").addEventListener("click",e=>{
  station="aihara"
  render()
})

$("#first-card button").addEventListener("click",e=>{
  isComingToHosei=!isComingToHosei
  render()
})