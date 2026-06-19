import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, info: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    this.setState({ info })
    console.error('[ChefCloud] Ошибка компонента:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div style={{
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        minHeight:'60vh', padding:32, textAlign:'center',
      }}>
        <div style={{ width:64, height:64, borderRadius:20, background:'#fff5f5', border:'1px solid #fecaca', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <div style={{ fontSize:20, fontWeight:800, color:'#1a1a1a', marginBottom:8 }}>Что-то пошло не так</div>
        <div style={{ fontSize:13.5, color:'#6b6560', maxWidth:400, lineHeight:1.6, marginBottom:20 }}>
          Произошла ошибка в интерфейсе. Ваши данные не затронуты — они сохранены в localStorage.
        </div>
        {this.state.error && (
          <div style={{ fontSize:12, color:'#a39f98', background:'#faf8f4', border:'1px solid #e8e2d8', borderRadius:12, padding:'10px 16px', marginBottom:20, fontFamily:'monospace', maxWidth:500, wordBreak:'break-all' }}>
            {this.state.error.toString()}
          </div>
        )}
        <div style={{ display:'flex', gap:10 }}>
          <button
            onClick={() => this.setState({ hasError: false, error: null, info: null })}
            style={{ padding:'10px 20px', borderRadius:12, border:'1.5px solid #e8e2d8', background:'#fff', cursor:'pointer', fontSize:13.5, fontWeight:700, color:'#1a1a1a' }}
          >Попробовать снова</button>
          <button
            onClick={() => window.location.reload()}
            style={{ padding:'10px 20px', borderRadius:12, border:'none', background:'#16332b', color:'#fff', cursor:'pointer', fontSize:13.5, fontWeight:700 }}
          >Перезагрузить страницу</button>
        </div>
      </div>
    )
  }
}
