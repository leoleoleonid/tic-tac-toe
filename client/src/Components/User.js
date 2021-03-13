function User(props) {
	return (
		<div className="user" onClick={() => props.onSelectUser(props.user)} className={ props.selected ? "selected" : '' }>
			<div className="description">
				<div className="name">
					{props.user.username +  (props.user.self ? " (yourself)" : "") }
				</div>
				<div className="status">
					{ props.user.connected ? 'online' : 'offline' }
				</div>
			</div>
			{props.user.hasNewMessages && (
				<div className="new-messages">!</div>
			)}
		</div>
	);
}

export default User;
