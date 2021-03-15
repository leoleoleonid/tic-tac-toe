import React, {Fragment} from 'react';
import {Table, Row, Col, Button} from 'react-bootstrap';
import './GameBoard.css';
import socket from "../socket";
import events from '../../eventsConfig';

function GameBoard(props) {

	const selectCell = (i, j) => {
		socket.emit(events.selectCell, { gameId: props.gameId, "i": i, "j": j });
	};

	const showGameStatus = () => {
		if (props.gameData.game_status === 'ongoing') {
			return (
				<p>Ongoing game</p>
			);
		}

		if (props.gameData.game_status === 'draw') {
			return (
				<p>Draw!</p>
			);
		}

		const status = `YOU ${socket.userID === props.gameData.game_winner ? 'WIN' : 'LOSE'}!`
		return (
			<p>{status}</p>
		);
	};

	const generateCellDOM = () => {
		let table = []
		for (let i = 0; i < 3; i++) {
			let children = []
			for (let j = 0; j < 3; j++) {
				var showWinnerCell = false;
				if (props.gameData.game_status === "won") {
					for (let k = 0; k < props.gameData.winning_combination.length; k++) {
						if (i === props.gameData.winning_combination[k][0] && j === props.gameData.winning_combination[k][1]) {
							showWinnerCell = true;
							break;
						}
					}
				}
				children.push(<td key={"cell" + i + j} className={showWinnerCell ? "winner-cell" : ""} >
					<div
						key={"cell-div" + i + j}
						className={"cell cell-" + props.gameData.playboard[i][j]}
						onClick=
							{(props.gameData.game_status !== "ongoing" ||
							socket.userID !== props.gameData.whose_turn ||
							props.gameData.playboard[i][j] ?
								() => console.log('no no no') : () => selectCell(i, j))}>
					</div>
				</td>)
			}
			table.push(<tr key={"row" + i} >{children}</tr>)
		}
		return table
	}

	return (
		props.gameData ? <Fragment>
			<Row>
				<Col>
					<Table bordered>
						<tbody>
						{
							generateCellDOM()
						}
						</tbody>
					</Table>
				</Col>
			</Row>
			<Row>
				{
					showGameStatus()
				}
			</Row>
			<Row>
				<Button onClick={props.startNewGame}>New Game</Button>
			</Row>
		</Fragment> : <p>Gathering Data</p>
	)
}

export default GameBoard;
