

function User(props) {
	if (props.user.self) {
		return (
			<div className="user">
				<div className="description">
					<div className="name">
						{"your user: " + props.user.username }
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="user" onClick={() => props.onSelectUser(props.user)} className={ props.selected ? "selected" : '' }>
			<div className="description">
				<div className="name">
					{props.user.username}
				</div>
				<div className="status">
					{ props.user.connected ? 'online' : 'offline' }
				</div>
			</div>
			{props.user.hasOngoingGame && (
				<div className="new-messages">!</div>
			)}
		</div>
	);
}

export default User;
