var modal = new tingle.modal({
    footer: true,
    stickyFooter: false,
    closeMethods: ['overlay', 'button', 'escape'],
    closeLabel: "Close",
    cssClass: ['custom-class-1', 'custom-class-2'],
    onOpen: function() {
        console.log('modal open');
    },
    onClose: function() {
        console.log('modal closed');
        document.getElementById("error").className = "pure-u-1";
    },
    beforeClose: function() {
        // here's goes some logic
        // e.g. save content before closing the modal
        return true; // close the modal
    	return false; // nothing happens
    }
});

document.addEventListener("DOMContentLoaded", function(event) { 
  document.getElementById('globeVideo').play();
});
modal.addFooterBtn('Button label', '', function() {
    // here goes some logic
    modal.close();
});

// add another button
modal.addFooterBtn('Dangerous action !', '', function() {
    // here goes some logic
    modal.close();
});

// set content
modal.setContent(document.getElementById("modal-main").innerHTML);
modal.setFooterContent(document.getElementById("modal-footer").innerHTML)
function openModal(e){
  console.log("opening modal")
  modal.open();
}

function signIn(e){
  document.getElementById("error").className = "pure-u-1 active";
}

function contact(){
  modal.close();
  let input = document.getElementById("email-input");
  input.focus();
}
