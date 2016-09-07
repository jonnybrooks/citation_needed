var socket = io('http://localhost:8888/player');
socket.on('connect', () => {
	console.log('established');
	changeView('player-registration');
})
socket.on('enter-lobby', () => {
	changeView('lobby');
})
socket.on('force-disconnect', () => {
	console.log('server issued a disconnect request');
	changeView('player-registration');
})

$('body').on('click', '#view-player-registration .submit', e => {
	console.log('click registered');
	socket.emit('create', {
		_roomKey: $('#view-player-registration ._roomKey').val(),
		name: $('#view-player-registration .name').val()
	})
})

function changeView(view) {
	let frag = fragment($(`#v-view-${view}`).html());
	$('#view-container').html(frag);
}

function fragment(htmlStr) {
	var frag = document.createDocumentFragment();
	var temp = document.createElement('div');
	temp.innerHTML = htmlStr;
	while (temp.firstChild) { frag.appendChild(temp.firstChild);}
	return frag;
}