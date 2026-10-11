"use client";
import {useCallback, useEffect, useRef, useState} from "react";
export function useResource(loader) {
  const sequence = useRef(0);
  const [state, setState] = useState({data: null, loading: true, error: null, loader});
  const execute = useCallback(() => {
    const id = ++sequence.current;
    return Promise.resolve().then(loader).then(data => {
      if (id === sequence.current) setState({data, loading: false, error: null, loader});
      return data;
    }, error => {
      if (id === sequence.current) setState({data: null, loading: false, error, loader});
      return null;
    });
  }, [loader]);
  const invalidate = useCallback(() => {sequence.current++;}, []);
  useEffect(() => {execute(); return invalidate;}, [execute, invalidate]);
  const reload = useCallback(() => {
    setState(s => ({...s, loader, loading: true, error: null})); return execute();
  }, [execute, loader]);
  return {...(state.loader === loader ? state : {data: null, loading: true, error: null}), reload};
}
