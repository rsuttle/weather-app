import styled from "styled-components";

//Total width of the three buttons should be 30% of screen
const ControlButton = styled.button`
 
 /* Small devices (landscape phones, 576px and up)*/
@media (min-width: 375px) { 
    width: ${props => (props.userWindowWidth * 1 / 2) / 3}px;
    height: ${props => (props.userWindowWidth * 1 / 2) / 3}px;
}

/* Medium devices (tablets, 768px and up)*/
@media (min-width: 768px) {
    width: ${props => (props.userWindowWidth * 1 / 2) / 3}px;
    height: ${props => (props.userWindowWidth * 1 / 2) / 3}px;
}

/* Large devices (desktops, 992px and up)*/
@media (min-width: 992px) {
    width: ${props => (props.userWindowWidth * 1 / 6) / 3}px;
    height: ${props => (props.userWindowWidth * 1 / 6) / 3}px;
}

/* Extra large devices (large desktops, 1200px and up)*/
@media (min-width: 1200px) {
    width: ${props => (props.userWindowWidth * 1 / 6) / 3}px;
    height: ${props => (props.userWindowWidth * 1 / 6) / 3}px;
}`

export default ControlButton;