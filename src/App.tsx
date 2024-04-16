import { useState, useRef } from "react";
import React from "react";
import "./App.css";

function App() {
	const inputRef = useRef<HTMLInputElement>(null);
	const [isRecording, setIsRecording] = useState<boolean>(false);
	const [profile1Count, setProfile1Count] = useState<number>(0);
	const [profile2Count, setProfile2Count] = useState<number>(0);
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [digraphList, setDigraphList] = useState<Array<string>>([]);
	const pressedTime = useRef<{ [key: string]: number }>({});
	const digraphInfo = useRef<{
		[key: string]: { total_time: number; items: number };
	}>({});
	const startDigraphInfo = useRef<{ timestamp: number; key: string }>();
	const typingProfiles = useRef<
		{
			name: string;
			digraphInfo: {
				[key: string]: { total_time: number; items: number };
			};
			totalTime: number; //
		}[]
	>([]); // Stores profiles

	const handleOnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		pressedTime.current[e.key] = e.timeStamp;
		if (startDigraphInfo.current === undefined) {
			setIsRecording(true);
			console.log("digraph start");
		}
		if (startDigraphInfo.current !== undefined) {
			// console.log(
			// 	"startdigraph calculation for pair",
			// 	`${startDigraphInfo.current.key}${e.key}`
			// );
			const timeDiff = e.timeStamp - startDigraphInfo.current.timestamp;
			const pairKey = `[${startDigraphInfo.current.key}${e.key}]`;
			if (digraphInfo.current[pairKey] !== undefined) {
				digraphInfo.current[pairKey].total_time += timeDiff;
				digraphInfo.current[pairKey].items += 1;
			} else {
				const temp = {
					total_time: timeDiff,
					items: 1,
				};
				digraphInfo.current[pairKey] = temp;
			}
		}
		// console.log("set start digraph", e.key);
		startDigraphInfo.current = {
			timestamp: e.timeStamp,
			key: e.key,
		};
	};

	const handleOnKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
		//console.log(e.key, e.timeStamp);
		const currentTimestamp = e.timeStamp;
		const previousTimestamp = pressedTime.current[e.key];
		pressedTime.current[e.key] = currentTimestamp - previousTimestamp;
	};

	const handleRender = () => {
		if (!digraphInfo.current) return;
		const newList: Array<string> = [];
		Object.keys(digraphInfo.current).forEach((pairKey) => {
			if (digraphInfo.current !== undefined) {
				newList.push(
					`${pairKey}: ${Math.round(
						digraphInfo.current[pairKey].total_time /
							digraphInfo.current[pairKey].items
					)} ms`
				);
			}
		});
		setDigraphList(newList);
	};

	const handleSaveProfile = (name: string) => {
		if (!digraphInfo.current) return;
		const profile = {
			name,
			digraphInfo: digraphInfo.current,
			totalTime: calculateTotalTime(), // Calculate total time
		};
		if (name.includes("1")) {
			setProfile1Count((prev) => prev + 1);
		} else if (name.includes("2")) {
			setProfile2Count((prev) => prev + 1);
		}
		typingProfiles.current.push(profile);
		handleRender();
		resetDigraph();
	};

	const calculateTotalTime = () => {
		let totalTime = 0;
		Object.values(pressedTime.current).forEach((time) => {
			totalTime += time;
		});
		return totalTime;
	};

	const resetDigraph = () => {
		// Reset digraph info for next profile
		console.log("digraph info reset");
		setIsRecording(false);
		digraphInfo.current = {};
		startDigraphInfo.current = undefined;
	};

	const identifyUser = (newDigraphInfo: {
		[key: string]: { total_time: number; items: number };
	}) => {
		if (!typingProfiles.current.length) return;

		const K = 3; // K nearest neighbors

		// Calculate distances
		const distances = typingProfiles.current.map((profile) => {
			let distance = 0;
			console.log(profile, newDigraphInfo);
			Object.keys(newDigraphInfo).forEach((key) => {
				const profileDigraph = profile.digraphInfo[key];
				const newDigraph = newDigraphInfo[key];
				if (profileDigraph && newDigraph) {
					const avgTimeDiff = profileDigraph.total_time / profileDigraph.items;
					const newAvgTimeDiff = newDigraph.total_time / newDigraph.items;
					//console.log(avgTimeDiff, newAvgTimeDiff);
					distance += Math.pow(avgTimeDiff - newAvgTimeDiff, 2); // Squared difference
				}
			});
			return { name: profile.name, distance };
		});

		// Sort by distance (closest first)
		distances.sort((a, b) => a.distance - b.distance);

		console.log("DISTANCES", distances);

		// Majority vote among K nearest neighbors
		const nameCounts: { [key: string]: number } = {};
		for (let i = 0; i < K; i++) {
			const name = distances[i].name;
			nameCounts[name] = (nameCounts[name] || 0) + 1;
		}

		console.log("VOTES", nameCounts);

		let maxVote = 0;
		let identifiedUser;

		Object.keys(nameCounts).forEach((name) => {
			if (nameCounts[name] > maxVote) {
				maxVote = nameCounts[name];
				identifiedUser = name;
			}
		});

		console.log(identifiedUser);

		return identifiedUser;
	};

	const handleIdentify = () => {
		if (!digraphInfo.current) return;
		handleRender();
		const newDigraphInfo = digraphInfo.current;
		const identifiedUser = identifyUser(newDigraphInfo);
		alert(`Identified User: ${identifiedUser}!!!!!`);
		digraphInfo.current = {}; // Reset digraph info for next identification
	};

	return (
		<div className="flex flex-col gap-3 bg-neutral-900 p-5 min-h-screen text-white">
			<div className="flex flex-col gap-2 bg-neutral-800 text-white p-5 rounded-lg text-left border-[1px] border-neutral-700">
				<div className="font-bold text-xl">GUIDE:</div>
				<div className="text-neutral-300">
					<div className="font-bold p-1">DATA GATHER PHASE</div>
					<div>1. Player 1 type the sentence</div>
					<div>2. Player 1 click "Save as Profile 1" when done</div>
					<div>3. Player 1 repeats above steps</div>
					<div>4. Player 2 type the sentence</div>
					<div>5. Player 2 click "Save as Profile 2" when done</div>
					<div>6. Player 2 repeats above steps</div>
				</div>
				<div className="text-neutral-300">
					<div className="font-bold p-1">TRAINING + IDENTIFICATION PHASE</div>
					<div>1. Either player can type any phrase or sentence</div>
					<div>
						2. Click "Identify User" when done to get identification result
					</div>
				</div>
			</div>
			<div className="flex flex-col bg-neutral-800 p-5 rounded-lg border-[1px] border-neutral-700">
				<div>
					Profile 1:{" "}
					<span className="text-orange-500">{profile1Count} Samples</span>
				</div>
				<div>
					Profile 2:{" "}
					<span className="text-yellow-500">{profile2Count} Samples</span>
				</div>
			</div>

			<div className="flex flex-col gap-2 bg-neutral-800 p-5 rounded-lg border-[1px] border-neutral-700">
				<div className="flex text-white gap-2">
					<span>DIGRAPH RECORD STATE:</span>
					{isRecording ? (
						<span className="text-green-400">RECORDING</span>
					) : (
						<span className="text-pink-400">NOT RECORDING</span>
					)}
				</div>
				<div className="flex gap-1">
					<input
						ref={inputRef}
						onKeyDown={(e) => handleOnKeyDown(e)}
						onKeyUp={(e) => handleOnKeyUp(e)}
						className="p-2 border-[1px] rounded-md flex-1 bg-neutral-900 border-neutral-700"
						placeholder="Type a sentence.."
					/>
					<button
						onClick={() => {
							if (inputRef.current) inputRef.current.value = "";
							resetDigraph();
						}}
						className="bg-red-500 hover:bg-red-600 border-[1px] border-red-400 text-white w-10 h-10 rounded-lg m-auto"
					>
						X
					</button>
				</div>
				<div className="flex gap-2">
					<button
						onClick={() => {
							window.location.reload();
						}}
						className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-2 p-1 flex-1"
					>
						RESET EVERYTHING
					</button>
					<button
						onClick={() => handleSaveProfile("Profile 1")}
						className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-2 p-1 flex-1"
					>
						SAVE AS PROFILE 1
					</button>
					<button
						onClick={() => handleSaveProfile("Profile 2")}
						className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg px-2 p-1 flex-1"
					>
						SAVE AS PROFILE 2
					</button>
					<button
						onClick={handleIdentify}
						className="bg-green-500 hover:bg-green-600 text-white rounded-lg px-2 p-1 flex-1"
					>
						IDENTIFY USER
					</button>
				</div>
			</div>
			{digraphList.length > 0 ? (
				<div className="flex flex-col bg-neutral-800 border-[1px] border-neutral-700 gap-1 p-5 rounded-lg">
					<div className="font-bold text-xl pb-2">DIGRAPH DATA:</div>
					<div className="bg-neutral-900 p-2 rounded-lg border-[1px] border-neutral-700">
						{digraphList.map((item) => {
							return (
								<p key={Math.random()} className="text-white">
									{item}
								</p>
							);
						})}
					</div>
				</div>
			) : null}
		</div>
	);
}

export default App;
