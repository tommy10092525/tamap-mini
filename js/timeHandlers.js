const equationOfTime=9

const dayIndices = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function timeToMinutes({
  hour,
  minute,
}) {
  return hour * 60 + minute;
}

export function timeDifference({
  nowInMinute,
  busInMinute,
}) {
  return busInMinute - nowInMinute;
}

export function isHoliday({
  date,
  holidayData,
}) {
  const newDate = structuredClone(date);
  // 日本時間と標準時の差を足す。
  // 文字列としてみた際に日本の日付になるようにする。
  newDate.setHours(newDate.getHours() + equationOfTime);
  const formattedDate = newDate.toISOString().split("T")[0];
  if (!holidayData) {
    throw new Error("Holiday data is not provided");
  }
  return holidayData[formattedDate];
}

// 平日かどうかを判定
export function isWeekday(day) {
  return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].includes(day);
}

// 次の曜日を取得する関数（祝日も「日曜日」として扱う）
export function getNextDay({
  currentDate,
  holidayData,
}) {
  const nextDate = new Date(currentDate);
  const currentDay = dayIndices[currentDate.getDay()];
  nextDate.setDate(nextDate.getDate() + 1);
  if (
    isHoliday({
      date: nextDate,
      holidayData,
    })
  ) {
    return "Sunday"; // 祝日を日曜日と扱う
  }
  const nextDayIndex = (dayIndices.indexOf(currentDay) + 1) % 7;
  return dayIndices[nextDayIndex];
}

export function getPreviousDay({
  currentDate,
  holidayData,
}) {
  const previousDate = new Date(currentDate);
  const currentDay = dayIndices[currentDate.getDay()];
  previousDate.setDate(previousDate.getDate() - 1);
  if (
    isHoliday({
      date: previousDate,
      holidayData,
    })
  ) {
    return "Sunday"; // 祝日を日曜日と扱う
  }
  const previousDayIndex = (dayIndices.indexOf(currentDay) - 1 + 7) % 7;
  return dayIndices[previousDayIndex];
}

// 現在の曜日のバスを取得
export const filterByConditions = ({
  timetable,
  station,
  isComingToHosei,
}) => {
  const newTimetable = timetable
    .slice()
    .filter(
      (item) =>
        item.station === station && item.isComingToHosei === isComingToHosei,
    );
  return newTimetable;
};

// dateの時刻と秒を変更する
export const setHoursAndMinutes = ({
  date,
  hour,
  minute,
}) => {
  const updatedDate = new Date(date);
  updatedDate.setHours(hour, minute);
  return updatedDate;
};

// 次のバスを検索
export function findNextBuses({
  timetable,
  holidayData,
  currentDate,
  length,
  isComingToHosei,
  station,
}) {
  const currentHour = currentDate.getHours();
  const currentMinutes = currentDate.getMinutes();
  const currentDay = dayIndices[currentDate.getDay()];
  const nowInms =timeToMinutes({
    hour: currentHour,
    minute: currentMinutes,
  });
  const returnBuses = [];
  // 現在の曜日のバスを取得

  const nowInMinute = timeToMinutes({
    hour: currentHour,
    minute: currentMinutes,
  });

  const newTimetable = filterByConditions({
    timetable: timetable.sort((a, b) => {
      if (
        a.leaveHour * 60 + a.leaveMinute >=
        b.leaveHour * 60 + b.leaveMinute
      ) {
        return 1;
      } else {
        return -1;
      }
    }),
    isComingToHosei,
    station,
  });


  if (length <= -1) {
    newTimetable.reverse();
  }

  // forループを回してdayToCheckを変えていって条件に合致するバスを検索する
  let dayToCheck = isHoliday({
    date: currentDate,
    holidayData,
  })
    ? "Sunday"
    : currentDay;

  const dateToCheck = structuredClone(currentDate);
  // バスが見つかるまで次の日に進む
  for (let i = 0; i < 7; i++) {

    // ループですべての曜日について順番に検証し，適切なバスが存在するかどうか検証する。
    // 特定の曜日の時刻だけ選択
    const busesForDay = newTimetable
      .slice()
      .filter(
        (bus) =>
          bus.day === dayToCheck ||
          (isWeekday(dayToCheck) && bus.day === "Weekday"),
      );
    let m = -1;
    if (length >= 1) {
      m = binarySearch({
        data: busesForDay,
        cmpCallbackFn: (bus) => {
          const busLeaveTime = timeToMinutes({
            hour: bus.leaveHour,
            minute: bus.leaveMinute,
          });
          return (
            i > 0 ||
           nowInMinute>busLeaveTime >= 0
          );
        },
      });
    } else {
      m = binarySearch({
        data: busesForDay,
        cmpCallbackFn: (bus) => {
          const busLeaveTime = timeToMinutes({ 
            hour: bus.leaveHour,
            minute: bus.leaveMinute,
          });
        
          return (
            i > 0 ||
            timeDifference({
              nowInMinute,
              busInMinute: busLeaveTime,
            }) < 0
          );
        },
      });
    }
    
    for (let mm = m; mm < busesForDay.length && m !== -1; mm++) {
      returnBuses.push(busesForDay[mm])
      if (returnBuses.length >= Math.abs(length)) {
        return length > 0 ? returnBuses : returnBuses.reverse()
      }
    }
    
   

    if (length >= 1) {
      // lengthが1以上の場合曜日を1進める
      dayToCheck = getNextDay({
        currentDate: dateToCheck,
        holidayData,
      });
      dateToCheck.setDate(dateToCheck.getDate() + 1);
    } else {
      // lengthが1以上の場合曜日を1戻す
      dayToCheck = getPreviousDay({
        currentDate: dateToCheck,
        holidayData,
      });
      dateToCheck.setDate(dateToCheck.getDate() - 1);
    }
  }
  return returnBuses;
}

// 分単位を `hh:mm` に戻す関数
export function minuteToTime(minutes) {
  const hs = String(Math.floor(minutes / 60));
  const mins = String(minutes % 60).padStart(2, "0");
  return `${hs}:${mins}`;
}


export function getDateString(now) {
  return `${now.getFullYear().toString().padStart(4, "0")}/${(now.getMonth() + 1).toString().padStart(2, "0")}/${now.getDate().toString().padStart(2, "0")}`;
}

export function getTimeString(now) {
  return `${now.getHours().toString()}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
}

export const binarySearch = ({
  data,
  cmpCallbackFn,
}) => {
  if (data.length === 0) {
    return -1;
  }
  let left = 0;
  let right = data.length;
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (cmpCallbackFn(data[mid])) {
      right = mid;
    } else {
      left = mid + 1;
    }
  }
  return left;
};

export const keioRapid=({ timetable })=>{
  const table = {
    nishihachiojiToHosei: {
      8: [38, 
        {time:45,gym:true},
         {time:52,gym:true}],
      10: [26, 27, 31, 38],
      12: [56],
      13: [6],
      14:[46,56]
    }, mejirodaiToHosei: {
      8: [41, 46, 51, 53, 59],
      9: [0],
      10: [30, 31, 35, 39, 42, 46, 51, 54],
      13: [4, 10, 14],
      14: [54],
      15:[0,4]
    }, hoseiToNishihachioji: {
      12:[58],
      15:[28,35,45],
      17:[15,25,35],
      19:[5,15]
    },hoseiToMejirodai:{
      12:[58],
      15:[38,48,56],
      17:[18,28,38],
      19:[8,18]      
    }
  }

  const gen=({station,isComingToHosei,leaveHour,leaveMinute,gym})=>{
    return {
      id:crypto.randomUUID(),
      day:"Weekday",station,isComingToHosei,leaveHour,leaveMinute,stopList:[],gym
    }
  }

  Object.entries(table.nishihachiojiToHosei).map(([key,value])=>{
    value.map(minute=>{
      if(typeof minute==="number"){
        timetable.push(gen({
          gym:false,
          isComingToHosei:true,
          leaveHour:parseInt(key),
          leaveMinute:minute,
          station:"nishihachioji"
        }))
      }else{
        timetable.push(gen({
          gym:true,
          isComingToHosei:true,
          leaveHour:parseInt(key),
          leaveMinute:minute.time,
          station:"nishihachioji"
        }))
      }
    })
  })
  Object.entries(table.mejirodaiToHosei).map(([key,value])=>{
    value.map(minute=>{
      if(typeof minute==="number"){
        timetable.push(gen({
          gym:false,
          isComingToHosei:true,
          leaveHour:parseInt(key),
          leaveMinute:minute,
          station:"mejirodai"
        }))
      }else{
        timetable.push(gen({
          gym:true,
          isComingToHosei:true,
          leaveHour:parseInt(key),
          leaveMinute:minute.time,
          station:"mejirodai"
        }))
      }
    })
  })

  Object.entries(table.hoseiToNishihachioji).map(([key,value])=>{
    value.map(minute=>{
      if(typeof minute==="number"){
        timetable.push(gen({
          gym:false,
          isComingToHosei:false,
          leaveHour:parseInt(key),
          leaveMinute:minute,
          station:"nishihachioji"
        }))
      }else{
        timetable.push(gen({
          gym:false,
          isComingToHosei:false,
          leaveHour:parseInt(key),
          leaveMinute:minute.time,
          station:"nishihachioji"
        }))
      }
    })
  })

  Object.entries(table.hoseiToMejirodai).map(([key,value])=>{
    value.map(minute=>{
      if(typeof minute==="number"){
        timetable.push(gen({
          gym:false,
          isComingToHosei:false,
          leaveHour:parseInt(key),
          leaveMinute:minute,
          station:"mejirodai"
        }))
      }else{
        timetable.push(gen({
          gym:false,
          isComingToHosei:false,
          leaveHour:parseInt(key),
          leaveMinute:minute.time,
          station:"mejirodai"
        }))
      }
    })
  })
  
  return timetable
}
