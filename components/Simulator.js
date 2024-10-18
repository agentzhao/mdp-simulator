import React from "react";
import { useState, useEffect } from "react";
import QueryAPI from "./QueryAPI";

const Direction = {
  NORTH: 0,
  EAST: 2,
  SOUTH: 4,
  WEST: 6,
  SKIP: 8,
};

const ObDirection = {
  NORTH: 0,
  EAST: 2,
  SOUTH: 4,
  WEST: 6,
  SKIP: 8,
};

const DirectionToString = {
  0: "Up",
  2: "Right",
  4: "Down",
  6: "Left",
  8: "None",
};

const transformCoord = (x, y) => {
  // Change the coordinate system from (0, 0) at top left to (0, 0) at bottom left
  return { x: 19 - y, y: x };
};

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Simulator() {
  const [robotState, setRobotState] = useState({
    x: 1,
    y: 1,
    d: Direction.NORTH,
    s: -1,
  });
  const [robotX, setRobotX] = useState(1);
  const [robotY, setRobotY] = useState(1);
  const [robotDir, setRobotDir] = useState(0);
  const [obstacles, setObstacles] = useState([
    { x: 1, y: 8, d: 4, id: 7 },
    { x: 8, y: 5, d: 4, id: 8 },
    { x: 13, y: 7, d: 2, id: 10 },
    { x: 6, y: 9, d: 2, id: 3 },
    { x: 11, y: 13, d: 2, id: 4 },
  ]);
  const [obXInput, setObXInput] = useState(0);
  const [obYInput, setObYInput] = useState(0);
  const [directionInput, setDirectionInput] = useState(ObDirection.NORTH);
  const [isComputing, setIsComputing] = useState(false);
  const [path, setPath] = useState([]);
  const [commands, setCommands] = useState([]);
  const [page, setPage] = useState(0);

  // Drawing the SVG lines between points in the path
  //
  const gridSize = 20; // 20x20 grid
  const cellSize = 32; // Size of each cell in pixels
  const svgSize = gridSize * cellSize; // Size of the SVG canvas

  // Adjust SVG rendering for correct scaling and centralization
  const renderPathLines = () => {
    const lines = [];

    for (let i = 0; i < path.length - 1; i++) {
      const start = transformCoord(path[i].x, path[i].y);
      const end = transformCoord(path[i + 1].x, path[i + 1].y);

      lines.push(
        <line
          key={i}
          x1={start.y * cellSize + cellSize / 2} // Adjust based on cell size
          y1={start.x * cellSize + cellSize / 2}
          x2={end.y * cellSize + cellSize / 2}
          y2={end.x * cellSize + cellSize / 2}
          stroke="red"
          strokeWidth="3" // Increase stroke width for better visibility
        />,
      );
    }

    return lines;
  };

  const generateNewID = () => {
    while (true) {
      let new_id = Math.floor(Math.random() * 10) + 1; // just try to generate an id;
      let ok = true;
      for (const ob of obstacles) {
        if (ob.id === new_id) {
          ok = false;
          break;
        }
      }
      if (ok) {
        return new_id;
      }
    }
  };

  const generateRobotCells = () => {
    const robotCells = [];
    let markerX = 0;
    let markerY = 0;

    if (Number(robotState.d) === Direction.NORTH) {
      markerY++;
    } else if (Number(robotState.d) === Direction.EAST) {
      markerX++;
    } else if (Number(robotState.d) === Direction.SOUTH) {
      markerY--;
    } else if (Number(robotState.d) === Direction.WEST) {
      markerX--;
    }

    // Go from i = -1 to i = 1
    for (let i = -1; i < 2; i++) {
      // Go from j = -1 to j = 1
      for (let j = -1; j < 2; j++) {
        // Transform the coordinates to our coordinate system where (0, 0) is at the bottom left
        const coord = transformCoord(robotState.x + i, robotState.y + j);
        // If the cell is the marker cell, add the robot state to the cell
        if (markerX === i && markerY === j) {
          robotCells.push({
            x: coord.x,
            y: coord.y,
            d: robotState.d,
            s: robotState.s,
          });
        } else {
          robotCells.push({
            x: coord.x,
            y: coord.y,
            d: null,
            s: -1,
          });
        }
      }
    }

    return robotCells;
  };

  const onChangeX = (event) => {
    // If the input is an integer and is in the range [0, 19], set ObXInput to the input
    if (Number.isInteger(Number(event.target.value))) {
      const nb = Number(event.target.value);
      if (0 <= nb && nb < 20) {
        setObXInput(nb);
        return;
      }
    }
    // If the input is not an integer or is not in the range [0, 19], set the input to 0
    setObXInput(0);
  };

  const onChangeY = (event) => {
    // If the input is an integer and is in the range [0, 19], set ObYInput to the input
    if (Number.isInteger(Number(event.target.value))) {
      const nb = Number(event.target.value);
      if (0 <= nb && nb <= 19) {
        setObYInput(nb);
        return;
      }
    }
    // If the input is not an integer or is not in the range [0, 19], set the input to 0
    setObYInput(0);
  };

  const onChangeRobotX = (event) => {
    // If the input is an integer and is in the range [1, 18], set RobotX to the input
    if (Number.isInteger(Number(event.target.value))) {
      const nb = Number(event.target.value);
      if (1 <= nb && nb < 19) {
        setRobotX(nb);
        return;
      }
    }
    // If the input is not an integer or is not in the range [1, 18], set the input to 1
    setRobotX(1);
  };

  const onChangeRobotY = (event) => {
    // If the input is an integer and is in the range [1, 18], set RobotY to the input
    if (Number.isInteger(Number(event.target.value))) {
      const nb = Number(event.target.value);
      if (1 <= nb && nb < 19) {
        setRobotY(nb);
        return;
      }
    }
    // If the input is not an integer or is not in the range [1, 18], set the input to 1
    setRobotY(1);
  };

  const onClickObstacle = () => {
    // If the input is not valid, return
    if (!obXInput && !obYInput) return;
    // Create a new array of obstacles
    const newObstacles = [...obstacles];
    // Add the new obstacle to the array
    newObstacles.push({
      x: obXInput,
      y: obYInput,
      d: directionInput,
      id: generateNewID(),
    });
    // Set the obstacles to the new array
    setObstacles(newObstacles);
  };

  const onClickRobot = () => {
    // Set the robot state to the input

    setRobotState({ x: robotX, y: robotY, d: robotDir, s: -1 });
  };

  const onDirectionInputChange = (event) => {
    // Set the direction input to the input
    setDirectionInput(Number(event.target.value));
  };

  const onRobotDirectionInputChange = (event) => {
    // Set the robot direction to the input
    setRobotDir(event.target.value);
  };

  const onRemoveObstacle = (ob) => {
    // If the path is not empty or the algorithm is computing, return
    if (path.length > 0 || isComputing) return;
    // Create a new array of obstacles
    const newObstacles = [];
    // Add all the obstacles except the one to remove to the new array
    for (const o of obstacles) {
      if (o.x === ob.x && o.y === ob.y) continue;
      newObstacles.push(o);
    }
    // Set the obstacles to the new array
    setObstacles(newObstacles);
  };

  const compute = () => {
    // Set computing to true, act like a lock
    setIsComputing(true);
    // Call the query function from the API
    QueryAPI.query(obstacles, robotX, robotY, robotDir, (data, err) => {
      console.log("Obstacles:", obstacles);
      if (data) {
        // If the data is valid, set the path
        setPath(data.data.path);
        console.log(data.data.path);

        // Set the commands
        const commands = [];
        for (let x of data.data.commands) {
          // If the command is a snapshot, skip it
          if (x.startsWith("SNAP")) {
            // draw a dot on the gui
            // console.log(data.data.commands);
            continue;
          }
          commands.push(x);
        }
        setCommands(commands);
        console.log("Commands:", commands);
      }
      // Set computing to false, release the lock
      setIsComputing(false);
    });
  };

  const onResetAll = () => {
    // Reset all the states
    setRobotX(1);
    setRobotDir(0);
    setRobotY(1);
    setRobotState({ x: 1, y: 1, d: Direction.NORTH, s: -1 });
    setPath([]);
    setCommands([]);
    setPage(0);
    setObstacles([]);
  };

  const onReset = () => {
    // Reset all the states
    setRobotX(1);
    setRobotDir(0);
    setRobotY(1);
    setRobotState({ x: 1, y: 1, d: Direction.NORTH, s: -1 });
    setPath([]);
    setCommands([]);
    setPage(0);
  };

  const renderGrid = () => {
    // Initialize the empty rows array
    const rows = [];

    const baseStyle = {
      width: 25,
      height: 25,
      borderStyle: "solid",
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      padding: 0,
    };

    // Generate robot cells
    const robotCells = generateRobotCells();

    // Generate the grid
    for (let i = 0; i < 20; i++) {
      const cells = [
        // Header cells
        <td key={i} className="w-5 h-5 md:w-8 md:h-8">
          <span className="font-bold md:text-base text-sky-900 text-[0.6rem]">
            {19 - i}
          </span>
        </td>,
      ];

      for (let j = 0; j < 20; j++) {
        let foundOb = null;
        let foundRobotCell = null;

        for (const ob of obstacles) {
          const transformed = transformCoord(ob.x, ob.y);
          if (transformed.x === i && transformed.y === j) {
            foundOb = ob;
            break;
          }
        }

        if (!foundOb) {
          for (const cell of robotCells) {
            if (cell.x === i && cell.y === j) {
              foundRobotCell = cell;
              break;
            }
          }
        }

        if (foundOb) {
          if (foundOb.d === Direction.WEST) {
            cells.push(
              <td className="w-5 h-5 bg-black border border-l-4 md:w-8 md:h-8 border-l-red-500" />,
            );
          } else if (foundOb.d === Direction.EAST) {
            cells.push(
              <td className="w-5 h-5 bg-black border border-r-4 md:w-8 md:h-8 border-r-red-500" />,
            );
          } else if (foundOb.d === Direction.NORTH) {
            cells.push(
              <td className="w-5 h-5 bg-black border border-t-4 md:w-8 md:h-8 border-t-red-500" />,
            );
          } else if (foundOb.d === Direction.SOUTH) {
            cells.push(
              <td className="w-5 h-5 bg-black border border-b-4 md:w-8 md:h-8 border-b-red-500" />,
            );
          } else if (foundOb.d === Direction.SKIP) {
            cells.push(
              <td className="w-5 h-5 bg-black border md:w-8 md:h-8" />,
            );
          }
        } else if (foundRobotCell) {
          if (foundRobotCell.d !== null) {
            cells.push(
              <td
                className={`border w-5 h-5 md:w-8 md:h-8 ${
                  foundRobotCell.s != -1 ? "bg-red-500" : "bg-yellow-300"
                }`}
              />,
            );
          } else {
            cells.push(
              <td className="w-5 h-5 bg-gray-600 border border-gray-300 md:w-8 md:h-8" />,
            );
          }
        } else {
          cells.push(
            <td className="w-5 h-5 border border-black md:w-8 md:h-8" />,
          );
        }
      }

      rows.push(<tr key={19 - i}>{cells}</tr>);
    }

    const yAxis = [<td key={0} />];
    for (let i = 0; i < 20; i++) {
      yAxis.push(
        <td className="w-5 h-5 md:w-8 md:h-8">
          <span className="font-bold md:text-base text-sky-900 text-[0.6rem]">
            {i}
          </span>
        </td>,
      );
    }
    rows.push(<tr key={20}>{yAxis}</tr>);
    return rows;
  };

  useEffect(() => {
    if (page >= path.length) return;
    setRobotState(path[page]);
  }, [page, path]);

  return (
    <div className="flex flex-col justify-center items-center">
      <div className="flex flex-col items-center mb-8 text-center rounded-xl shadow-xl bg-sky-200">
        <h2 className="pt-4 text-black card-title">Algorithm Simulator</h2>
      </div>

      <div className="flex flex-col items-center text-center rounded-xl shadow-xl bg-sky-200">
        <div className="items-center p-4 text-center card-body">
          <h2 className="text-black card-title">Robot Position</h2>
          <div className="form-control">
            <label className="input-group input-group-horizontal">
              <span className="p-2 bg-primary">X</span>
              <input
                onChange={onChangeRobotX}
                type="number"
                placeholder="1"
                min="1"
                max="18"
                className="w-20 text-blue-900 input input-bordered"
              />
              <span className="p-2 bg-primary">Y</span>
              <input
                onChange={onChangeRobotY}
                type="number"
                placeholder="1"
                min="1"
                max="18"
                className="w-20 text-blue-900 input input-bordered"
              />
              <span className="p-2 bg-primary">D</span>
              <select
                onChange={onRobotDirectionInputChange}
                value={robotDir}
                className="py-2 pr-6 pl-2 text-blue-900 select"
              >
                <option value={ObDirection.NORTH}>Up</option>
                <option value={ObDirection.SOUTH}>Down</option>
                <option value={ObDirection.WEST}>Left</option>
                <option value={ObDirection.EAST}>Right</option>
              </select>
              <button className="p-2 btn btn-success" onClick={onClickRobot}>
                Set
              </button>
            </label>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center p-4 m-8 text-center rounded-xl shadow-xl bg-sky-200">
        <h2 className="pb-2 text-black card-title">Add Obstacles</h2>
        <div className="form-control">
          <label className="input-group input-group-horizontal">
            <span className="p-2 bg-primary">X</span>
            <input
              onChange={onChangeX}
              type="number"
              placeholder="1"
              min="0"
              max="19"
              className="w-20 text-blue-900 input input-bordered"
            />
            <span className="p-2 bg-primary">Y</span>
            <input
              onChange={onChangeY}
              type="number"
              placeholder="1"
              min="0"
              max="19"
              className="w-20 text-blue-900 input input-bordered"
            />
            <span className="p-2 bg-primary">D</span>
            <select
              onChange={onDirectionInputChange}
              value={directionInput}
              className="py-2 pr-6 pl-2 text-blue-900 select"
            >
              <option value={ObDirection.NORTH}>Up</option>
              <option value={ObDirection.SOUTH}>Down</option>
              <option value={ObDirection.WEST}>Left</option>
              <option value={ObDirection.EAST}>Right</option>
              <option value={ObDirection.SKIP}>None</option>
            </select>
            <button className="p-2 btn btn-success" onClick={onClickObstacle}>
              Add
            </button>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-x-2 gap-y-4 items-center">
        {obstacles.map((ob) => {
          return (
            <div
              key={ob}
              className="flex flex-row text-xs text-black rounded-xl border-cyan-500 md:text-sm badge bg-sky-100 h-max"
            >
              <div className="flex flex-col">
                <div>X: {ob.x}</div>
                <div>Y: {ob.y}</div>
                <div>D: {DirectionToString[ob.d]}</div>
              </div>
              <div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="inline-block w-4 h-4 stroke-current"
                  onClick={() => onRemoveObstacle(ob)}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </div>
            </div>
          );
        })}
      </div>
      <div className="py-4 btn-group btn-group-horizontal">
        <button className="btn btn-error" onClick={onResetAll}>
          Reset All
        </button>
        <button className="btn btn-warning" onClick={onReset}>
          Reset Robot
        </button>
        <button className="btn btn-success" onClick={compute}>
          Submit
        </button>
      </div>

      {path.length > 0 && (
        <div className="flex flex-row items-center p-4 my-8 text-center rounded-xl shadow-xl bg-sky-200">
          <button
            className="pt-2 pl-1 btn btn-circle"
            disabled={page === 0}
            onClick={() => {
              setPage(page - 1);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"
              />
            </svg>
          </button>

          <span className="mx-5 text-black">
            Step: {page + 1} / {path.length}
          </span>
          <span className="mx-5 text-black">{commands[page]}</span>
          <button
            className="pt-2 pl-2 btn btn-circle"
            disabled={page === path.length - 1}
            onClick={() => {
              setPage(page + 1);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"
              />
            </svg>
          </button>
        </div>
      )}
      <div className="relative">
        <svg
          width={svgSize}
          height={svgSize}
          className="absolute top-0 left-8 z-10"
        >
          {renderPathLines()}
        </svg>
        <table className="z-0 border-collapse">
          <tbody>{renderGrid()}</tbody>
        </table>
      </div>
    </div>
  );
}
