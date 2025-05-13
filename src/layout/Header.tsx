import { useUser } from '@civic/auth-web3/react'
import styled from 'styled-components'
// import {useCivicAuth} from "@civic/auth-web3/react"


const copyText = (text:string)=>{

  navigator.clipboard.writeText(text)
}

const Header = () => {
    const {user}= useUser()

  return (
    <HeaderBody>
        <p>{user && user.name}</p>
        <p>LLLLL</p>
    </HeaderBody>
  )
}

export default Header

const HeaderBody= styled.div`
  border: 2px solid red;

`

