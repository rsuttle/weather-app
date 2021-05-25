import styled from "styled-components";

//Control buttons are positioned 80% from top of screen, and in the middle
const ControlButtonsContainer = styled.div`
position: absolute;

/* Small devices (landscape phones, 576px and up) */
@media (min-width: 375px) {
    
    top: ${props => props.userWindowHeight * 4 / 5}px;
    left: ${props => props.userWindowWidth / 2 - (1 / 4 * props.userWindowWidth)}px;
}

/* Medium devices (tablets, 768px and up) */
@media (min-width: 768px) {
    top: ${props => props.userWindowHeight * 4 / 5}px;
    left: ${props => props.userWindowWidth / 2 - (1 / 4 * props.userWindowWidth)}px;
}

/* Large devices (desktops, 992px and up) */
@media (min-width: 992px) {
    
    top: ${props => props.userWindowHeight * 4 / 5}px;
    left: ${props => props.userWindowWidth / 2 - (1 / 12 * props.userWindowWidth)}px;
}

/*Extra large devices (large desktops, 1200px and up)*/
@media (min-width: 1200px) {
    top: ${props => props.userWindowHeight * 4 / 5}px;
    left: ${props => props.userWindowWidth / 2 - (1 / 12 * props.userWindowWidth)}px;
}

`

export default ControlButtonsContainer;