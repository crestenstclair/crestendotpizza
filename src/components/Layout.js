import React from 'react'
import Helmet from 'react-helmet'

import Navbar from '../components/Navbar'
import './all.sass'
import './prism/css/dracula-prism.css';

const TemplateWrapper = ({ children }) => (
  <div>
    <Helmet title="Cresten's Pizza Blog" />
    <Navbar />
    <div>{children}</div>
    <link href="https://fonts.googleapis.com/css?family=Roboto" rel="stylesheet" />
  </div>
)

export default TemplateWrapper
